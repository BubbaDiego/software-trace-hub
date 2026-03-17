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
