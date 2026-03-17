"""RTM analyzer — computes coverage stats, gap analysis, and module breakdowns."""
from __future__ import annotations

import json
from typing import Optional

from .rtm_db import RTMDatabase
from .models import (
    GapType,
    GapPriority,
    RTMOverview,
    RTMModuleCoverage,
    RTMSnapshot,
)


# ── Module canonical names ─────────────────────────────────────────

KNOWN_MODULES = ["PCU", "LVP", "SYR", "PCA", "EtCO2", "SPO2", "Auto-ID"]


# ── Gap Analysis ───────────────────────────────────────────────────

def run_gap_analysis(project_id: int, db: RTMDatabase | None = None) -> dict:
    """Analyze all requirements in a project and populate rtm_gap_analysis.

    Returns summary stats.
    """
    db = db or RTMDatabase.get_instance()

    # Clear previous gaps for this project
    db.execute("DELETE FROM rtm_gap_analysis WHERE project_id = ?", (project_id,))

    # Fetch all requirements
    rows = db.fetchall(
        "SELECT id, srd_id, feature, impacted_modules, hazard_id, spec_id, trace_status "
        "FROM rtm_requirements WHERE project_id = ?",
        (project_id,),
    )

    gap_counts = {"no_tests": 0, "manual_only": 0, "no_spec": 0, "scenario_gap": 0}
    total_gaps = 0

    for req in rows:
        req_id = req["id"]
        srd_id = req["srd_id"]
        feature = req["feature"]
        modules = req["impacted_modules"]
        hazard_id = req["hazard_id"]
        spec_id = req["spec_id"]
        trace = req["trace_status"]

        # Collect evidence for this requirement
        evidence = db.fetchall(
            "SELECT evidence_type, tc_count FROM rtm_test_evidence "
            "WHERE requirement_id = ?",
            (req_id,),
        )

        has_manual = any("manual" in e["evidence_type"] for e in evidence)
        has_cats = any("cats" in e["evidence_type"] for e in evidence)
        has_scenario = any("scenario" in e["evidence_type"] for e in evidence)
        has_spec = bool(spec_id)

        gaps_for_req = []

        # P1: No test evidence at all
        if not has_manual and not has_cats:
            gap_type = GapType.NO_TESTS.value
            # Hazard-linked with no tests = always P1
            priority = GapPriority.P1.value
            gaps_for_req.append((gap_type, priority))
            gap_counts["no_tests"] += 1

        # P2: Manual only, no automation
        elif has_manual and not has_cats:
            gap_type = GapType.MANUAL_ONLY.value
            # Hazard-linked without CATS = P1, otherwise P2
            priority = GapPriority.P1.value if hazard_id else GapPriority.P2.value
            gaps_for_req.append((gap_type, priority))
            gap_counts["manual_only"] += 1

        # P3: No spec ID linked
        if not has_spec and srd_id:
            gap_type = GapType.NO_SPEC.value
            priority = GapPriority.P3.value
            gaps_for_req.append((gap_type, priority))
            gap_counts["no_spec"] += 1

        # Scenario gap: has evidence but no scenario-based tests for multi-module reqs
        module_list = [m.strip() for m in modules.split(",") if m.strip()]
        if len(module_list) > 1 and not has_scenario and (has_manual or has_cats):
            gap_type = GapType.SCENARIO_GAP.value
            priority = GapPriority.P3.value
            gaps_for_req.append((gap_type, priority))
            gap_counts["scenario_gap"] += 1

        # Insert gaps
        for gap_type, priority in gaps_for_req:
            db.execute(
                "INSERT INTO rtm_gap_analysis "
                "(requirement_id, project_id, srd_id, feature, module, "
                " gap_type, priority) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (req_id, project_id, srd_id, feature, modules, gap_type, priority),
            )
            total_gaps += 1

    db.commit()

    return {
        "project_id": project_id,
        "total_gaps": total_gaps,
        "breakdown": gap_counts,
    }


# ── Coverage Overview ──────────────────────────────────────────────

def compute_overview(project_id: int, db: RTMDatabase | None = None) -> RTMOverview:
    """Compute the executive overview stats for a project."""
    db = db or RTMDatabase.get_instance()

    project = db.fetchone("SELECT * FROM rtm_projects WHERE id = ?", (project_id,))
    if not project:
        raise ValueError(f"Project {project_id} not found")

    total = project["total_requirements"]

    # Trace status counts
    covered = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_requirements "
        "WHERE project_id = ? AND trace_status = 'full'",
        (project_id,),
    )["c"]

    partial = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_requirements "
        "WHERE project_id = ? AND trace_status = 'partial'",
        (project_id,),
    )["c"]

    missing = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_requirements "
        "WHERE project_id = ? AND trace_status = 'missing'",
        (project_id,),
    )["c"]

    # Gap count
    gap_count = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_gap_analysis WHERE project_id = ?",
        (project_id,),
    )["c"]

    # Hazard-linked
    hazard_linked = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_requirements "
        "WHERE project_id = ? AND hazard_id != ''",
        (project_id,),
    )["c"]

    # Unique features
    features_rows = db.fetchall(
        "SELECT feature, COUNT(*) as cnt FROM rtm_requirements "
        "WHERE project_id = ? AND feature != '' "
        "GROUP BY feature ORDER BY cnt DESC",
        (project_id,),
    )
    features = {r["feature"]: r["cnt"] for r in features_rows}

    # Module distribution
    modules = _compute_module_distribution(project_id, db)

    coverage_pct = round((covered / total) * 100, 1) if total > 0 else 0.0

    from .models import RTMProject
    proj_model = RTMProject(
        id=project["id"],
        name=project["name"],
        version=project["version"],
        sheet_name=project["sheet_name"],
        uploaded_at=project["uploaded_at"],
        file_hash=project["file_hash"],
        total_requirements=total,
    )

    return RTMOverview(
        project=proj_model,
        total_requirements=total,
        covered=covered,
        partial=partial,
        missing=missing,
        coverage_pct=coverage_pct,
        gap_count=gap_count,
        hazard_linked=hazard_linked,
        feature_count=len(features),
        module_count=len(modules),
        modules=modules,
        features=features,
    )


# ── Module Coverage ────────────────────────────────────────────────

def compute_module_coverage(
    project_id: int, db: RTMDatabase | None = None
) -> list[RTMModuleCoverage]:
    """Compute per-module coverage stats."""
    db = db or RTMDatabase.get_instance()
    results = []

    for module in KNOWN_MODULES:
        # Reqs that list this module in impacted_modules
        # Use LIKE with commas to avoid partial matches (e.g. "PCA" matching "PCACATS")
        pattern_exact = module
        reqs = db.fetchall(
            "SELECT r.id, r.trace_status FROM rtm_requirements r "
            "WHERE r.project_id = ? AND ("
            "  r.impacted_modules = ? OR "
            "  r.impacted_modules LIKE ? OR "
            "  r.impacted_modules LIKE ? OR "
            "  r.impacted_modules LIKE ?"
            ")",
            (
                project_id,
                pattern_exact,
                f"{module},%",
                f"%, {module},%",
                f"%, {module}",
            ),
        )

        total = len(reqs)
        if total == 0:
            continue

        req_ids = [r["id"] for r in reqs]

        # Count requirements with manual evidence for this module
        manual_count = 0
        cats_count = 0
        fully_covered = 0

        for req_id in req_ids:
            ev = db.fetchall(
                "SELECT evidence_type FROM rtm_test_evidence WHERE requirement_id = ?",
                (req_id,),
            )
            has_m = any("manual" in e["evidence_type"] for e in ev)
            has_c = any("cats" in e["evidence_type"] for e in ev)
            if has_m:
                manual_count += 1
            if has_c:
                cats_count += 1
            if has_m and has_c:
                fully_covered += 1

        # Gaps for this module
        gap_count = db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_gap_analysis "
            "WHERE project_id = ? AND ("
            "  module = ? OR module LIKE ? OR module LIKE ? OR module LIKE ?"
            ")",
            (project_id, module, f"{module},%", f"%, {module},%", f"%, {module}"),
        )["c"]

        coverage_pct = round((fully_covered / total) * 100, 1) if total else 0.0
        manual_pct = round((manual_count / total) * 100, 1) if total else 0.0
        cats_pct = round((cats_count / total) * 100, 1) if total else 0.0

        results.append(RTMModuleCoverage(
            module_name=module,
            total_reqs=total,
            manual_covered=manual_count,
            cats_covered=cats_count,
            fully_covered=fully_covered,
            gap_count=gap_count,
            coverage_pct=coverage_pct,
            manual_pct=manual_pct,
            cats_pct=cats_pct,
        ))

    return results


# ── Feature × Module Heatmap ──────────────────────────────────────

def compute_heatmap(
    project_id: int,
    top_n_features: int = 15,
    db: RTMDatabase | None = None,
) -> dict:
    """Compute a feature × module coverage heatmap.

    Returns: {
        "features": [...],
        "modules": [...],
        "cells": { "Feature|Module": pct, ... }
    }
    """
    db = db or RTMDatabase.get_instance()

    # Top features by count
    features_rows = db.fetchall(
        "SELECT feature, COUNT(*) as cnt FROM rtm_requirements "
        "WHERE project_id = ? AND feature != '' "
        "GROUP BY feature ORDER BY cnt DESC LIMIT ?",
        (project_id, top_n_features),
    )
    feature_names = [r["feature"] for r in features_rows]

    cells = {}

    for feature in feature_names:
        for module in KNOWN_MODULES:
            # Reqs matching both feature and module
            total = db.fetchone(
                "SELECT COUNT(*) as c FROM rtm_requirements "
                "WHERE project_id = ? AND feature = ? AND ("
                "  impacted_modules = ? OR impacted_modules LIKE ? "
                "  OR impacted_modules LIKE ? OR impacted_modules LIKE ?"
                ")",
                (project_id, feature, module,
                 f"{module},%", f"%, {module},%", f"%, {module}"),
            )["c"]

            if total == 0:
                continue

            covered = db.fetchone(
                "SELECT COUNT(*) as c FROM rtm_requirements "
                "WHERE project_id = ? AND feature = ? AND trace_status = 'full' AND ("
                "  impacted_modules = ? OR impacted_modules LIKE ? "
                "  OR impacted_modules LIKE ? OR impacted_modules LIKE ?"
                ")",
                (project_id, feature, module,
                 f"{module},%", f"%, {module},%", f"%, {module}"),
            )["c"]

            pct = round((covered / total) * 100, 1) if total else 0.0
            cells[f"{feature}|{module}"] = {
                "total": total,
                "covered": covered,
                "pct": pct,
            }

    return {
        "features": feature_names,
        "modules": KNOWN_MODULES,
        "cells": cells,
    }


# ── Snapshot ───────────────────────────────────────────────────────

def take_snapshot(project_id: int, db: RTMDatabase | None = None) -> RTMSnapshot:
    """Capture a point-in-time snapshot of coverage metrics."""
    db = db or RTMDatabase.get_instance()

    overview = compute_overview(project_id, db)

    # Count total CATS and manual evidence rows
    cats_count = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_test_evidence te "
        "JOIN rtm_requirements r ON te.requirement_id = r.id "
        "WHERE r.project_id = ? AND te.evidence_type LIKE '%cats%'",
        (project_id,),
    )["c"]

    manual_count = db.fetchone(
        "SELECT COUNT(*) as c FROM rtm_test_evidence te "
        "JOIN rtm_requirements r ON te.requirement_id = r.id "
        "WHERE r.project_id = ? AND te.evidence_type LIKE '%manual%'",
        (project_id,),
    )["c"]

    db.execute(
        "INSERT INTO rtm_snapshots "
        "(project_id, total_reqs, covered, partial, missing, "
        " cats_count, manual_count, gap_count) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            project_id,
            overview.total_requirements,
            overview.covered,
            overview.partial,
            overview.missing,
            cats_count,
            manual_count,
            overview.gap_count,
        ),
    )
    db.commit()

    snap = db.fetchone(
        "SELECT * FROM rtm_snapshots WHERE project_id = ? ORDER BY id DESC LIMIT 1",
        (project_id,),
    )
    return RTMSnapshot(
        id=snap["id"],
        project_id=snap["project_id"],
        snapshot_date=snap["snapshot_date"],
        total_reqs=snap["total_reqs"],
        covered=snap["covered"],
        partial=snap["partial"],
        missing=snap["missing"],
        cats_count=snap["cats_count"],
        manual_count=snap["manual_count"],
        gap_count=snap["gap_count"],
    )


# ── Internal helpers ───────────────────────────────────────────────

def _compute_module_distribution(
    project_id: int, db: RTMDatabase
) -> dict[str, int]:
    """Count requirements per module."""
    result = {}
    for module in KNOWN_MODULES:
        count = db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_requirements "
            "WHERE project_id = ? AND ("
            "  impacted_modules = ? OR impacted_modules LIKE ? "
            "  OR impacted_modules LIKE ? OR impacted_modules LIKE ?"
            ")",
            (project_id, module, f"{module},%", f"%, {module},%", f"%, {module}"),
        )["c"]
        if count > 0:
            result[module] = count
    return result
