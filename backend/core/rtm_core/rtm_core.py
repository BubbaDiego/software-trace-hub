"""RTMCore — facade for RTM (Requirements Traceability Matrix) operations.

Usage:
    from core.rtm_core import RTMCore

    rtm = RTMCore()
    result = rtm.import_excel("/path/to/rtm.xlsx")
    overview = rtm.get_overview(result["project_id"])
"""
from __future__ import annotations

from .rtm_db import RTMDatabase
from .models import RTMOverview, RTMModuleCoverage, RTMSnapshot


class RTMCore:
    """High-level facade for RTM import, analysis, and querying."""

    def __init__(self, db: RTMDatabase | None = None):
        self._db = db or RTMDatabase.get_instance()

    # ── Import ─────────────────────────────────────────────────────

    def import_excel(
        self,
        file_path: str,
        sheet_name: str | None = None,
        project_name: str = "",
        project_version: str = "",
    ) -> dict:
        """Import an RTM Excel file. Returns import stats dict."""
        from .importer import import_excel

        result = import_excel(
            file_path=file_path,
            sheet_name=sheet_name,
            project_name=project_name,
            project_version=project_version,
            db=self._db,
        )

        # Auto-run gap analysis on successful import
        if result.get("status") == "success":
            from .analyzer import run_gap_analysis, take_snapshot

            gap_result = run_gap_analysis(result["project_id"], self._db)
            result["gap_analysis"] = gap_result

            snapshot = take_snapshot(result["project_id"], self._db)
            result["snapshot"] = snapshot.dict() if hasattr(snapshot, "dict") else {}

        return result

    def import_all_sheets(self, file_path: str) -> list[dict]:
        """Import all RTM-like sheets from an Excel file."""
        from .importer import import_all_sheets
        return import_all_sheets(file_path, self._db)

    # ── Analysis ───────────────────────────────────────────────────

    def run_gap_analysis(self, project_id: int) -> dict:
        """Re-run gap analysis for a project. Returns gap summary."""
        from .analyzer import run_gap_analysis
        return run_gap_analysis(project_id, self._db)

    def get_overview(self, project_id: int) -> RTMOverview:
        """Get executive overview stats."""
        from .analyzer import compute_overview
        return compute_overview(project_id, self._db)

    def get_module_coverage(self, project_id: int) -> list[RTMModuleCoverage]:
        """Get per-module coverage breakdown."""
        from .analyzer import compute_module_coverage
        return compute_module_coverage(project_id, self._db)

    def get_heatmap(self, project_id: int, top_n: int = 15) -> dict:
        """Get feature x module coverage heatmap."""
        from .analyzer import compute_heatmap
        return compute_heatmap(project_id, top_n, self._db)

    def take_snapshot(self, project_id: int) -> RTMSnapshot:
        """Take a point-in-time coverage snapshot."""
        from .analyzer import take_snapshot
        return take_snapshot(project_id, self._db)

    # ── Querying ───────────────────────────────────────────────────

    def list_projects(self) -> list[dict]:
        """List all imported RTM projects."""
        rows = self._db.fetchall(
            "SELECT * FROM rtm_projects ORDER BY uploaded_at DESC"
        )
        return [dict(r) for r in rows]

    def get_requirements(
        self,
        project_id: int,
        feature: str | None = None,
        module: str | None = None,
        trace_status: str | None = None,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """Query requirements with filters. Returns {items: [...], total: int}."""
        conditions = ["r.project_id = ?"]
        params: list = [project_id]

        if feature:
            conditions.append("r.feature = ?")
            params.append(feature)

        if module:
            conditions.append(
                "(r.impacted_modules = ? OR r.impacted_modules LIKE ? "
                "OR r.impacted_modules LIKE ? OR r.impacted_modules LIKE ?)"
            )
            params.extend([module, f"{module},%", f"%, {module},%", f"%, {module}"])

        if trace_status:
            conditions.append("r.trace_status = ?")
            params.append(trace_status)

        if search:
            conditions.append(
                "(r.srd_id LIKE ? OR r.feature LIKE ? OR r.spec_id LIKE ? "
                "OR r.software_feature LIKE ? OR r.composite_key LIKE ?)"
            )
            like = f"%{search}%"
            params.extend([like, like, like, like, like])

        where = " AND ".join(conditions)

        # Total count
        total = self._db.fetchone(
            f"SELECT COUNT(*) as c FROM rtm_requirements r WHERE {where}",
            tuple(params),
        )["c"]

        # Paginated results
        params.extend([limit, offset])
        rows = self._db.fetchall(
            f"SELECT r.* FROM rtm_requirements r "
            f"WHERE {where} ORDER BY r.sno ASC LIMIT ? OFFSET ?",
            tuple(params),
        )

        items = []
        for row in rows:
            item = dict(row)
            # Attach evidence summary
            evidence = self._db.fetchall(
                "SELECT evidence_type, module_name, tc_ids_json, tc_count "
                "FROM rtm_test_evidence WHERE requirement_id = ?",
                (row["id"],),
            )
            item["evidence"] = [dict(e) for e in evidence]
            items.append(item)

        return {"items": items, "total": total, "limit": limit, "offset": offset}

    def get_requirement_detail(self, requirement_id: int) -> dict | None:
        """Get a single requirement with full evidence and gap info."""
        req = self._db.fetchone(
            "SELECT * FROM rtm_requirements WHERE id = ?", (requirement_id,)
        )
        if not req:
            return None

        result = dict(req)

        # Evidence
        evidence = self._db.fetchall(
            "SELECT * FROM rtm_test_evidence WHERE requirement_id = ?",
            (requirement_id,),
        )
        result["evidence"] = [dict(e) for e in evidence]

        # Gaps
        gaps = self._db.fetchall(
            "SELECT * FROM rtm_gap_analysis WHERE requirement_id = ?",
            (requirement_id,),
        )
        result["gaps"] = [dict(g) for g in gaps]

        # STA enrichment (cross-domain read — shared DB makes this possible)
        sta_spec = self._db.fetchall(
            "SELECT * FROM rtm_sta_spec_refs WHERE requirement_id = ?",
            (requirement_id,),
        )
        sta_evidence = self._db.fetchall(
            "SELECT * FROM rtm_sta_module_evidence WHERE requirement_id = ?",
            (requirement_id,),
        )
        sta_design = self._db.fetchall(
            "SELECT * FROM rtm_sta_design_outputs WHERE requirement_id = ?",
            (requirement_id,),
        )
        sta_versions = self._db.fetchall(
            "SELECT * FROM rtm_sta_version_verification WHERE requirement_id = ? "
            "ORDER BY version_label",
            (requirement_id,),
        )

        result["sta_spec_refs"] = [dict(s) for s in sta_spec]
        result["sta_module_evidence"] = [dict(e) for e in sta_evidence]
        result["sta_design_outputs"] = [dict(d) for d in sta_design]
        result["sta_version_history"] = [dict(v) for v in sta_versions]
        result["sta_enriched"] = bool(sta_spec or sta_evidence or sta_design or sta_versions)

        return result

    def get_gaps(
        self,
        project_id: int,
        gap_type: str | None = None,
        priority: str | None = None,
        module: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """Query gaps with filters."""
        conditions = ["g.project_id = ?", "g.resolved_at IS NULL"]
        params: list = [project_id]

        if gap_type:
            conditions.append("g.gap_type = ?")
            params.append(gap_type)

        if priority:
            conditions.append("g.priority = ?")
            params.append(priority)

        if module:
            conditions.append(
                "(g.module = ? OR g.module LIKE ? "
                "OR g.module LIKE ? OR g.module LIKE ?)"
            )
            params.extend([module, f"{module},%", f"%, {module},%", f"%, {module}"])

        where = " AND ".join(conditions)

        total = self._db.fetchone(
            f"SELECT COUNT(*) as c FROM rtm_gap_analysis g WHERE {where}",
            tuple(params),
        )["c"]

        params.extend([limit, offset])
        rows = self._db.fetchall(
            f"SELECT g.* FROM rtm_gap_analysis g "
            f"WHERE {where} "
            f"ORDER BY CASE g.priority "
            f"  WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END, g.srd_id "
            f"LIMIT ? OFFSET ?",
            tuple(params),
        )

        return {"items": [dict(r) for r in rows], "total": total}

    def update_gap(
        self,
        gap_id: int,
        assigned_to: str | None = None,
        notes: str | None = None,
        resolved: bool = False,
    ) -> dict | None:
        """Update a gap record (assign owner, add notes, resolve)."""
        gap = self._db.fetchone(
            "SELECT * FROM rtm_gap_analysis WHERE id = ?", (gap_id,)
        )
        if not gap:
            return None

        updates = []
        params = []

        if assigned_to is not None:
            updates.append("assigned_to = ?")
            params.append(assigned_to)

        if notes is not None:
            updates.append("notes = ?")
            params.append(notes)

        if resolved:
            updates.append("resolved_at = datetime('now')")

        if not updates:
            return dict(gap)

        params.append(gap_id)
        self._db.execute(
            f"UPDATE rtm_gap_analysis SET {', '.join(updates)} WHERE id = ?",
            tuple(params),
        )
        self._db.commit()

        return dict(self._db.fetchone(
            "SELECT * FROM rtm_gap_analysis WHERE id = ?", (gap_id,)
        ))

    def get_snapshots(self, project_id: int) -> list[dict]:
        """Get all snapshots for a project (coverage over time)."""
        rows = self._db.fetchall(
            "SELECT * FROM rtm_snapshots WHERE project_id = ? ORDER BY snapshot_date",
            (project_id,),
        )
        return [dict(r) for r in rows]

    # ── Feature Aggregations ──────────────────────────────────────

    def get_feature_landscape(self, project_id: int) -> dict:
        """Get all features with their requirement counts, coverage, module span, and sub-feature counts."""
        rows = self._db.fetchall(
            "SELECT feature, sub_feature, trace_status, impacted_modules "
            "FROM rtm_requirements WHERE project_id = ? AND feature != ''",
            (project_id,),
        )
        features: dict[str, dict] = {}
        for r in rows:
            f = r["feature"]
            if f not in features:
                features[f] = {"feature": f, "total": 0, "covered": 0, "partial": 0,
                               "missing": 0, "sub_features": set(), "modules": set()}
            features[f]["total"] += 1
            features[f][r["trace_status"]] = features[f].get(r["trace_status"], 0) + 1
            if r["sub_feature"]:
                features[f]["sub_features"].add(r["sub_feature"])
            for m in r["impacted_modules"].split(","):
                m = m.strip()
                if m:
                    features[f]["modules"].add(m)

        items = []
        for f in sorted(features.values(), key=lambda x: -x["total"]):
            t = f["total"] or 1
            items.append({
                "feature": f["feature"],
                "total": f["total"],
                "covered": f.get("full", 0),
                "partial": f.get("partial", 0),
                "missing": f.get("missing", 0),
                "coverage_pct": round(f.get("full", 0) / t * 100, 1),
                "sub_feature_count": len(f["sub_features"]),
                "module_count": len(f["modules"]),
                "modules": sorted(f["modules"]),
            })
        return {"items": items, "total": len(items)}

    def get_feature_detail(self, project_id: int, feature: str) -> dict:
        """Get detailed breakdown for a single feature."""
        rows = self._db.fetchall(
            "SELECT id, sub_feature, trace_status, impacted_modules, hazard_id "
            "FROM rtm_requirements WHERE project_id = ? AND feature = ?",
            (project_id, feature),
        )
        if not rows:
            return None

        total = len(rows)
        covered = sum(1 for r in rows if r["trace_status"] == "full")
        partial = sum(1 for r in rows if r["trace_status"] == "partial")
        missing = sum(1 for r in rows if r["trace_status"] == "missing")
        hazard_linked = sum(1 for r in rows if r["hazard_id"])

        # Sub-feature breakdown
        subs: dict[str, dict] = {}
        modules = set()
        for r in rows:
            sf = r["sub_feature"] or "(none)"
            if sf not in subs:
                subs[sf] = {"sub_feature": sf, "total": 0, "covered": 0}
            subs[sf]["total"] += 1
            if r["trace_status"] == "full":
                subs[sf]["covered"] += 1
            for m in r["impacted_modules"].split(","):
                m = m.strip()
                if m:
                    modules.add(m)

        sub_items = sorted(subs.values(), key=lambda x: -x["total"])
        for s in sub_items:
            s["coverage_pct"] = round(s["covered"] / (s["total"] or 1) * 100, 1)

        # Evidence summary
        req_ids = [r["id"] for r in rows]
        manual_count = 0
        cats_count = 0
        total_tcs = 0
        if req_ids:
            placeholders = ",".join("?" * len(req_ids))
            ev_rows = self._db.fetchall(
                f"SELECT evidence_type, SUM(tc_count) as tc_sum, COUNT(*) as cnt "
                f"FROM rtm_test_evidence WHERE requirement_id IN ({placeholders}) "
                f"GROUP BY evidence_type",
                tuple(req_ids),
            )
            for e in ev_rows:
                total_tcs += e["tc_sum"] or 0
                if "manual" in e["evidence_type"]:
                    manual_count += e["cnt"]
                if "cats" in e["evidence_type"]:
                    cats_count += e["cnt"]

        # Gap summary
        gaps = self._db.fetchall(
            "SELECT gap_type, priority, COUNT(*) as cnt "
            "FROM rtm_gap_analysis WHERE project_id = ? AND feature = ? AND resolved_at IS NULL "
            "GROUP BY gap_type, priority",
            (project_id, feature),
        )
        gap_summary = [dict(g) for g in gaps]
        total_gaps = sum(g["cnt"] for g in gap_summary)

        # STA enrichment count
        sta_count = 0
        if req_ids:
            sta_count = self._db.fetchone(
                f"SELECT COUNT(*) as c FROM rtm_sta_spec_refs WHERE requirement_id IN ({placeholders})",
                tuple(req_ids),
            )["c"]

        return {
            "feature": feature,
            "total": total,
            "covered": covered,
            "partial": partial,
            "missing": missing,
            "coverage_pct": round(covered / (total or 1) * 100, 1),
            "hazard_linked": hazard_linked,
            "module_count": len(modules),
            "modules": sorted(modules),
            "sub_features": sub_items,
            "manual_evidence": manual_count,
            "cats_evidence": cats_count,
            "total_test_cases": total_tcs,
            "gap_summary": gap_summary,
            "total_gaps": total_gaps,
            "sta_enrichment": sta_count,
        }

    def get_feature_gaps(self, project_id: int) -> dict:
        """Get gap analysis aggregated by feature."""
        rows = self._db.fetchall(
            "SELECT feature, gap_type, priority, COUNT(*) as cnt "
            "FROM rtm_gap_analysis WHERE project_id = ? AND resolved_at IS NULL AND feature != '' "
            "GROUP BY feature, gap_type ORDER BY cnt DESC",
            (project_id,),
        )
        # Aggregate by feature
        features: dict[str, dict] = {}
        for r in rows:
            f = r["feature"]
            if f not in features:
                features[f] = {"feature": f, "total_gaps": 0, "no_tests": 0,
                               "manual_only": 0, "no_spec": 0, "scenario_gap": 0}
            features[f]["total_gaps"] += r["cnt"]
            features[f][r["gap_type"]] = features[f].get(r["gap_type"], 0) + r["cnt"]

        items = sorted(features.values(), key=lambda x: -x["total_gaps"])

        # Global totals
        totals = {"no_tests": 0, "manual_only": 0, "no_spec": 0, "scenario_gap": 0}
        for f in items:
            for gt in totals:
                totals[gt] += f.get(gt, 0)

        return {"items": items, "totals": totals, "feature_count": len(items)}

    def get_feature_evidence(self, project_id: int) -> dict:
        """Get evidence breakdown per feature: manual vs CATS counts."""
        rows = self._db.fetchall(
            "SELECT r.feature, e.evidence_type, COUNT(*) as cnt, SUM(e.tc_count) as tc_sum "
            "FROM rtm_requirements r "
            "JOIN rtm_test_evidence e ON e.requirement_id = r.id "
            "WHERE r.project_id = ? AND r.feature != '' "
            "GROUP BY r.feature, e.evidence_type",
            (project_id,),
        )
        features: dict[str, dict] = {}
        for r in rows:
            f = r["feature"]
            if f not in features:
                features[f] = {"feature": f, "manual_rows": 0, "cats_rows": 0,
                               "manual_tcs": 0, "cats_tcs": 0, "total_tcs": 0}
            tc = r["tc_sum"] or 0
            features[f]["total_tcs"] += tc
            if "manual" in r["evidence_type"]:
                features[f]["manual_rows"] += r["cnt"]
                features[f]["manual_tcs"] += tc
            if "cats" in r["evidence_type"]:
                features[f]["cats_rows"] += r["cnt"]
                features[f]["cats_tcs"] += tc

        items = sorted(features.values(), key=lambda x: -x["total_tcs"])
        return {"items": items, "total": len(items)}

    def delete_project(self, project_id: int) -> bool:
        """Delete a project and all associated data (cascades via FK)."""
        existing = self._db.fetchone(
            "SELECT id FROM rtm_projects WHERE id = ?", (project_id,)
        )
        if not existing:
            return False

        self._db.execute("DELETE FROM rtm_projects WHERE id = ?", (project_id,))
        self._db.commit()
        return True
