"""STACore — facade for all STA (Software Traceability Analysis) operations."""
from __future__ import annotations

from core.shared.database import SharedDatabase


class STACore:
    """High-level facade for STA import and querying."""

    def __init__(self, db: SharedDatabase | None = None):
        self._db = db or SharedDatabase.get_instance()

    def import_sta(
        self,
        file_path: str,
        project_id: int,
        sw_trace_sheet: str | None = None,
        div_sheet: str | None = None,
    ) -> dict:
        """Import STA Excel to enrich an existing RTM project."""
        from .sta_importer import import_sta_excel
        return import_sta_excel(
            file_path=file_path,
            project_id=project_id,
            sw_trace_sheet=sw_trace_sheet,
            div_sheet=div_sheet,
            db=self._db,
        )

    def get_summary(self, project_id: int) -> dict:
        """Get STA enrichment summary stats for a project."""
        project = self._db.fetchone(
            "SELECT sta_enriched_at FROM rtm_projects WHERE id = ?",
            (project_id,),
        )
        if not project:
            return {"enriched": False}

        spec_count = self._db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_sta_spec_refs WHERE project_id = ?",
            (project_id,),
        )["c"]
        ev_count = self._db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_sta_module_evidence WHERE project_id = ?",
            (project_id,),
        )["c"]
        design_count = self._db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_sta_design_outputs WHERE project_id = ?",
            (project_id,),
        )["c"]
        ver_count = self._db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_sta_version_verification WHERE project_id = ?",
            (project_id,),
        )["c"]

        versions = self._db.fetchall(
            "SELECT DISTINCT version_label FROM rtm_sta_version_verification "
            "WHERE project_id = ? ORDER BY version_label",
            (project_id,),
        )

        return {
            "enriched": bool(project["sta_enriched_at"]),
            "sta_enriched_at": project["sta_enriched_at"],
            "spec_refs": spec_count,
            "module_evidence": ev_count,
            "design_outputs": design_count,
            "version_records": ver_count,
            "versions_available": [v["version_label"] for v in versions],
        }

    def get_version_matrix(
        self,
        project_id: int,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
    ) -> dict:
        """Get version verification matrix — SRD IDs with per-version test refs."""
        conditions = ["v.project_id = ?"]
        params: list = [project_id]

        if search:
            conditions.append("v.srd_id LIKE ?")
            params.append(f"%{search}%")

        where = " AND ".join(conditions)

        total = self._db.fetchone(
            f"SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_version_verification v "
            f"WHERE {where}",
            tuple(params),
        )["c"]

        srd_params = list(params) + [limit, offset]
        srd_rows = self._db.fetchall(
            f"SELECT DISTINCT srd_id FROM rtm_sta_version_verification v "
            f"WHERE {where} ORDER BY srd_id LIMIT ? OFFSET ?",
            tuple(srd_params),
        )
        srd_ids = [r["srd_id"] for r in srd_rows]

        if not srd_ids:
            return {"items": [], "total": total, "versions": []}

        placeholders = ",".join("?" * len(srd_ids))
        all_rows = self._db.fetchall(
            f"SELECT srd_id, version_label, test_ref, ter_ref "
            f"FROM rtm_sta_version_verification "
            f"WHERE project_id = ? AND srd_id IN ({placeholders}) "
            f"ORDER BY srd_id, version_label",
            (project_id, *srd_ids),
        )

        # Pivot into {srd_id: {version_label: {test_ref, ter_ref}}}
        items = []
        current: dict | None = None
        for row in all_rows:
            srd = row["srd_id"]
            if current is None or current["srd_id"] != srd:
                if current:
                    items.append(current)
                current = {"srd_id": srd, "versions": {}}
            current["versions"][row["version_label"]] = {
                "test_ref": row["test_ref"],
                "ter_ref": row["ter_ref"],
            }
        if current:
            items.append(current)

        versions = self._db.fetchall(
            "SELECT DISTINCT version_label FROM rtm_sta_version_verification "
            "WHERE project_id = ? ORDER BY version_label",
            (project_id,),
        )

        return {
            "items": items,
            "total": total,
            "versions": [v["version_label"] for v in versions],
        }
