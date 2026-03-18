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

    def get_trace_graph(self, requirement_id: int) -> dict | None:
        """Build a full traceability graph for a single requirement.

        Returns nodes + edges suitable for a visual trace wizard.
        """
        req = self._db.fetchone(
            "SELECT * FROM rtm_requirements WHERE id = ?", (requirement_id,)
        )
        if not req:
            return None

        r = dict(req)
        rid = r["id"]
        srd = r["srd_id"]
        nodes = []
        edges = []

        # Fetch description from all available sources
        description = ""
        # 1. STA spec refs (best source)
        desc_row = self._db.fetchone(
            "SELECT description FROM rtm_sta_spec_refs WHERE srd_id = ? AND description != '' LIMIT 1",
            (srd,))
        if desc_row:
            description = desc_row["description"]
        # 2. FMEA requirement field (contains "SRD-XXXX: actual text")
        if not description:
            fmea_row = self._db.fetchone(
                "SELECT requirement FROM fmea_records WHERE requirement LIKE ? LIMIT 1",
                (f"%{srd}:%",))
            if fmea_row:
                # Extract just the text for this SRD
                for line in fmea_row["requirement"].split("\n"):
                    if srd in line and ":" in line:
                        description = line.split(":", 1)[1].strip()
                        break
        # 3. Build from composite fields if still empty
        if not description:
            parts = [r.get("software_feature", ""), r.get("sub_feature", ""), r.get("software_function", "")]
            desc_parts = [p for p in parts if p]
            if desc_parts:
                description = " → ".join(desc_parts)

        # Center: Requirement (with full detail)
        nodes.append({"id": f"req-{rid}", "type": "requirement", "label": srd,
                       "sub": r.get("software_function") or r.get("feature") or "",
                       "data": {"srd_id": srd, "feature": r["feature"],
                                "sub_feature": r.get("sub_feature", ""),
                                "software_feature": r.get("software_feature", ""),
                                "software_function": r.get("software_function", ""),
                                "module": r["impacted_modules"],
                                "prd_modules": r.get("prd_modules", ""),
                                "trace_status": r["trace_status"],
                                "composite_key": r.get("composite_key", ""),
                                "spec_id": r.get("spec_id", ""),
                                "tracker_id": r.get("tracker_id", ""),
                                "hazard_id": r.get("hazard_id", ""),
                                "description": description}})

        # Feature
        if r["feature"]:
            fid = f"feat-{r['feature']}"
            nodes.append({"id": fid, "type": "feature", "label": r["feature"],
                          "sub": r.get("sub_feature") or "",
                          "data": {"software_feature": r.get("software_feature", ""),
                                   "software_function": r.get("software_function", ""),
                                   "sub_feature": r.get("sub_feature", "")}})
            edges.append({"source": f"req-{rid}", "target": fid})

        # Spec refs (STA)
        specs = self._db.fetchall(
            "SELECT * FROM rtm_sta_spec_refs WHERE requirement_id = ?", (rid,))
        for s in specs:
            s = dict(s)
            spec_desc = s.get("description", "")
            prd_section = s.get("prd_section", "")
            sta_modules = s.get("sta_modules", "")
            for ref_field, ref_type in [("asws_ref", "ASWS"), ("aswui_ref", "ASWUI"), ("aswis_ref", "ASWIS")]:
                val = s.get(ref_field, "")
                if val:
                    for ref in [x.strip() for x in val.split(",") if x.strip()]:
                        sid = f"spec-{ref}"
                        if not any(n["id"] == sid for n in nodes):
                            nodes.append({"id": sid, "type": "spec", "label": ref, "sub": ref_type,
                                          "data": {"description": spec_desc, "prd_section": prd_section,
                                                   "modules": sta_modules, "ref_type": ref_type}})
                            edges.append({"source": f"req-{rid}", "target": sid})

        # Design outputs
        designs = self._db.fetchall(
            "SELECT * FROM rtm_sta_design_outputs WHERE requirement_id = ?", (rid,))
        for d in designs:
            d = dict(d)
            import json
            drefs = json.loads(d.get("design_refs_json") or "[]")
            ut_files = json.loads(d.get("unit_test_files_json") or "[]")
            for i, dr in enumerate(drefs[:5]):
                did = f"design-{rid}-{i}"
                nodes.append({"id": did, "type": "design", "label": str(dr)[:40], "sub": "SDD Section",
                              "data": {"design_ref": str(dr), "all_refs": drefs}})
                edges.append({"source": f"req-{rid}", "target": did})

            ut_count = d.get("unit_test_count", 0)
            if ut_count > 0:
                utid = f"ut-{rid}"
                nodes.append({"id": utid, "type": "test", "label": f"{ut_count} Unit Tests",
                              "sub": "Source files linked",
                              "data": {"files": ut_files[:20], "total_files": ut_count}})
                edges.append({"source": f"req-{rid}", "target": utid})

        # Test evidence
        evidence = self._db.fetchall(
            "SELECT * FROM rtm_test_evidence WHERE requirement_id = ?", (rid,))
        for e in evidence:
            e = dict(e)
            eid = f"ev-{e['id']}"
            tc_count = e.get("tc_count", 0)
            etype = e.get("evidence_type", "")
            module = e.get("module_name", "")
            tc_ids = json.loads(e.get("tc_ids_json") or "[]")
            label = f"{module or etype}" + (f" · {tc_count} TCs" if tc_count else "")
            nodes.append({"id": eid, "type": "test", "label": label, "sub": etype,
                          "data": {"evidence_type": etype, "module": module,
                                   "tc_count": tc_count, "tc_ids": tc_ids[:10]}})
            edges.append({"source": f"req-{rid}", "target": eid})

        # Gaps
        gaps = self._db.fetchall(
            "SELECT * FROM rtm_gap_analysis WHERE requirement_id = ?", (rid,))
        for g in gaps:
            g = dict(g)
            gid = f"gap-{g['id']}"
            nodes.append({"id": gid, "type": "gap",
                          "label": f"{g['gap_type']} ({g['priority']})",
                          "sub": g.get("assigned_to") or "Unassigned",
                          "data": {"gap_type": g["gap_type"], "priority": g["priority"],
                                   "assigned_to": g.get("assigned_to", ""),
                                   "notes": g.get("notes", ""),
                                   "feature": g.get("feature", ""),
                                   "module": g.get("module", "")}})
            edges.append({"source": f"req-{rid}", "target": gid})

        # Hazard
        if r.get("hazard_id"):
            hid = f"haz-{r['hazard_id']}"
            nodes.append({"id": hid, "type": "hazard", "label": r["hazard_id"], "sub": ""})
            edges.append({"source": f"req-{rid}", "target": hid})

        # FMEA cross-link (text match on requirement field)
        fmea_rows = self._db.fetchall(
            "SELECT id, fmea_id, hazard, product, severity, rcm_type, failure_mode "
            "FROM fmea_records WHERE requirement LIKE ?",
            (f"%{srd}%",))
        for f in fmea_rows:
            f = dict(f)
            fid = f"fmea-{f['id']}"
            nodes.append({"id": fid, "type": "fmea",
                          "label": f["fmea_id"],
                          "sub": f.get("product", ""),
                          "data": {"hazard": f.get("hazard", ""),
                                   "severity": f.get("severity", ""),
                                   "failure_mode": f.get("failure_mode", "")}})
            edges.append({"source": f"req-{rid}", "target": fid})
            # Link FMEA hazard to hazard node if exists
            if r.get("hazard_id"):
                edges.append({"source": f"haz-{r['hazard_id']}", "target": fid})

        # Version history
        versions = self._db.fetchall(
            "SELECT DISTINCT version_label FROM rtm_sta_version_verification "
            "WHERE requirement_id = ? ORDER BY version_label", (rid,))
        if versions:
            vid = f"ver-{rid}"
            vlabels = [v["version_label"] for v in versions]
            nodes.append({"id": vid, "type": "version",
                          "label": f"{len(vlabels)} Versions",
                          "sub": ", ".join(vlabels)})
            edges.append({"source": f"req-{rid}", "target": vid})

        return {
            "requirement": r,
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "specs": len([n for n in nodes if n["type"] == "spec"]),
                "design": len([n for n in nodes if n["type"] == "design"]),
                "tests": len([n for n in nodes if n["type"] == "test"]),
                "gaps": len([n for n in nodes if n["type"] == "gap"]),
                "hazards": len([n for n in nodes if n["type"] == "hazard"]),
                "fmea": len([n for n in nodes if n["type"] == "fmea"]),
                "versions": len([n for n in nodes if n["type"] == "version"]),
            },
        }

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

    # ── QA Metrics ──────────────────────────────────────────────

    def get_qa_metrics(
        self,
        project_id: int,
        feature: str | None = None,
        srd_id: str | None = None,
        spec_id: str | None = None,
        hazard_id: str | None = None,
    ) -> dict:
        """Get QA metrics with optional cross-filters.

        When a filter is set, ALL aggregations narrow to that subset.
        """
        # Build a WHERE clause for the requirement filter
        conditions = ["r.project_id = ?"]
        params: list = [project_id]

        if feature and feature != "All":
            conditions.append("r.feature = ?")
            params.append(feature)
        if srd_id and srd_id != "All":
            conditions.append("r.srd_id = ?")
            params.append(srd_id)
        if spec_id and spec_id != "All":
            conditions.append("r.spec_id = ?")
            params.append(spec_id)
        if hazard_id and hazard_id != "All":
            conditions.append("r.hazard_id = ?")
            params.append(hazard_id)

        where = " AND ".join(conditions)

        # Total test cases (filtered)
        total_tcs = self._db.fetchone(
            f"SELECT SUM(e.tc_count) as c FROM rtm_test_evidence e "
            f"JOIN rtm_requirements r ON e.requirement_id = r.id "
            f"WHERE {where}", tuple(params),
        )["c"] or 0

        # Feature → TC count (filtered)
        feature_tcs = self._db.fetchall(
            f"SELECT r.feature, SUM(e.tc_count) as total_tcs "
            f"FROM rtm_requirements r "
            f"JOIN rtm_test_evidence e ON e.requirement_id = r.id "
            f"WHERE {where} AND r.feature != '' "
            f"GROUP BY r.feature ORDER BY total_tcs DESC",
            tuple(params),
        )

        # Spec → TC count (filtered)
        spec_tcs = self._db.fetchall(
            f"SELECT r.spec_id, SUM(e.tc_count) as total_tcs "
            f"FROM rtm_requirements r "
            f"JOIN rtm_test_evidence e ON e.requirement_id = r.id "
            f"WHERE {where} AND r.spec_id != '' "
            f"GROUP BY r.spec_id ORDER BY total_tcs DESC",
            tuple(params),
        )

        # Top SRDs for flow diagram (filtered)
        flow_rows = self._db.fetchall(
            f"SELECT r.srd_id, r.feature, r.spec_id, SUM(e.tc_count) as total_tcs "
            f"FROM rtm_requirements r "
            f"JOIN rtm_test_evidence e ON e.requirement_id = r.id "
            f"WHERE {where} AND r.srd_id != '' "
            f"GROUP BY r.srd_id ORDER BY total_tcs DESC LIMIT 10",
            tuple(params),
        )

        # Unique counts (filtered)
        unique_features = self._db.fetchone(
            f"SELECT COUNT(DISTINCT r.feature) as c FROM rtm_requirements r "
            f"WHERE {where} AND r.feature != ''", tuple(params),
        )["c"]
        unique_specs = self._db.fetchone(
            f"SELECT COUNT(DISTINCT r.spec_id) as c FROM rtm_requirements r "
            f"WHERE {where} AND r.spec_id != ''", tuple(params),
        )["c"]
        unique_srds = self._db.fetchone(
            f"SELECT COUNT(DISTINCT r.srd_id) as c FROM rtm_requirements r "
            f"WHERE {where} AND r.srd_id != ''", tuple(params),
        )["c"]

        # All available filter options (unfiltered — so dropdowns always show full lists)
        all_features = self._db.fetchall(
            "SELECT DISTINCT feature FROM rtm_requirements "
            "WHERE project_id = ? AND feature != '' ORDER BY feature",
            (project_id,),
        )
        all_specs = self._db.fetchall(
            "SELECT DISTINCT spec_id FROM rtm_requirements "
            "WHERE project_id = ? AND spec_id != '' ORDER BY spec_id",
            (project_id,),
        )
        all_reqs = self._db.fetchall(
            "SELECT DISTINCT srd_id FROM rtm_requirements "
            "WHERE project_id = ? AND srd_id != '' ORDER BY srd_id",
            (project_id,),
        )
        all_hazards = self._db.fetchall(
            "SELECT DISTINCT hazard_id FROM rtm_requirements "
            "WHERE project_id = ? AND hazard_id != '' ORDER BY hazard_id",
            (project_id,),
        )

        return {
            "total_test_cases": total_tcs,
            "unique_features": unique_features,
            "unique_specs": unique_specs,
            "unique_requirements": unique_srds,
            "feature_tcs": [dict(r) for r in feature_tcs],
            "spec_tcs": [dict(r) for r in spec_tcs],
            "flow_data": [dict(r) for r in flow_rows],
            "all_features": [r["feature"] for r in all_features],
            "all_specs": [r["spec_id"] for r in all_specs],
            "all_requirements": [r["srd_id"] for r in all_reqs],
            "all_hazards": [r["hazard_id"] for r in all_hazards],
        }

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
