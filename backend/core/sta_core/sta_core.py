"""STACore — facade for all STA (Software Traceability Analysis) operations."""
from __future__ import annotations

import json

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

    # ── Overview (KPIs + charts) ──────────────────────────────────

    def get_overview(self, project_id: int) -> dict:
        """Get executive overview: KPIs, module evidence, PRD sections, coverage breakdown."""
        # Total SRDs in this project's STA data
        total_srds = self._db.fetchone(
            "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_spec_refs WHERE project_id = ?",
            (project_id,),
        )["c"]

        # Spec ref counts
        spec_count = self._db.fetchone(
            "SELECT COUNT(*) as c FROM rtm_sta_spec_refs WHERE project_id = ?",
            (project_id,),
        )["c"]

        # Unique design output documents
        design_rows = self._db.fetchall(
            "SELECT design_refs_json FROM rtm_sta_design_outputs WHERE project_id = ?",
            (project_id,),
        )
        all_design_refs = set()
        for r in design_rows:
            try:
                refs = json.loads(r["design_refs_json"])
                all_design_refs.update(refs)
            except (json.JSONDecodeError, TypeError):
                pass
        design_doc_count = len(all_design_refs)

        # Unique unit test files
        ut_rows = self._db.fetchall(
            "SELECT unit_test_files_json FROM rtm_sta_design_outputs WHERE project_id = ?",
            (project_id,),
        )
        all_ut_files = set()
        for r in ut_rows:
            try:
                files = json.loads(r["unit_test_files_json"])
                all_ut_files.update(files)
            except (json.JSONDecodeError, TypeError):
                pass
        ut_file_count = len(all_ut_files)

        # Version records
        ver_count = self._db.fetchone(
            "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_version_verification WHERE project_id = ?",
            (project_id,),
        )["c"]

        # Distinct modules
        modules_row = self._db.fetchall(
            "SELECT DISTINCT module_name FROM rtm_sta_module_evidence "
            "WHERE project_id = ? AND module_name != 'TOTAL' ORDER BY module_name",
            (project_id,),
        )
        module_count = len(modules_row)

        # Coverage breakdown: fully traced (has spec refs), partial, missing
        # "Fully traced" = SRD has at least one non-empty ASWS/ASWUI/ASWIS ref
        full = self._db.fetchone(
            "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_spec_refs "
            "WHERE project_id = ? AND (asws_ref != '' OR aswui_ref != '' OR aswis_ref != '')",
            (project_id,),
        )["c"]

        # Total SRDs from RTM requirements
        total_rtm = self._db.fetchone(
            "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_requirements "
            "WHERE project_id = ? AND srd_id != ''",
            (project_id,),
        )["c"]

        missing = max(0, total_rtm - total_srds)
        partial = max(0, total_srds - full)

        # Module evidence breakdown
        module_evidence = self._db.fetchall(
            "SELECT module_name, SUM(tc_count) as total_tc "
            "FROM rtm_sta_module_evidence "
            "WHERE project_id = ? AND module_name != 'TOTAL' "
            "GROUP BY module_name ORDER BY total_tc DESC",
            (project_id,),
        )

        # PRD section distribution
        prd_sections = self._db.fetchall(
            "SELECT prd_section, COUNT(DISTINCT srd_id) as srd_count "
            "FROM rtm_sta_spec_refs "
            "WHERE project_id = ? AND prd_section != '' "
            "GROUP BY prd_section ORDER BY srd_count DESC LIMIT 15",
            (project_id,),
        )

        return {
            "total_srds": total_srds or total_rtm,
            "spec_refs": spec_count,
            "design_docs": design_doc_count,
            "unit_test_files": ut_file_count,
            "version_records": ver_count,
            "module_count": module_count,
            "fully_traced": full,
            "partial_traced": partial,
            "missing_traced": missing,
            "module_evidence": [dict(r) for r in module_evidence],
            "prd_sections": [dict(r) for r in prd_sections],
        }

    # ── Spec Reference Matrix ─────────────────────────────────────

    def get_spec_refs(
        self,
        project_id: int,
        module: str | None = None,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """Get spec reference matrix with filtering."""
        conditions = ["s.project_id = ?"]
        params: list = [project_id]

        if module:
            conditions.append("s.sta_modules LIKE ?")
            params.append(f"%{module}%")

        if search:
            conditions.append(
                "(s.srd_id LIKE ? OR s.description LIKE ? OR s.prd_section LIKE ?)"
            )
            like = f"%{search}%"
            params.extend([like, like, like])

        where = " AND ".join(conditions)

        total = self._db.fetchone(
            f"SELECT COUNT(*) as c FROM rtm_sta_spec_refs s WHERE {where}",
            tuple(params),
        )["c"]

        query_params = list(params) + [limit, offset]
        rows = self._db.fetchall(
            f"SELECT s.srd_id, s.prd_section, s.description, s.sta_modules, "
            f"s.asws_ref, s.aswui_ref, s.aswis_ref "
            f"FROM rtm_sta_spec_refs s WHERE {where} "
            f"ORDER BY s.srd_id LIMIT ? OFFSET ?",
            tuple(query_params),
        )

        items = []
        for r in rows:
            has_asws = bool(r["asws_ref"])
            has_aswui = bool(r["aswui_ref"])
            has_aswis = bool(r["aswis_ref"])
            spec_count = sum([has_asws, has_aswui, has_aswis])
            coverage = "full" if spec_count == 3 else "partial" if spec_count > 0 else "none"
            items.append({
                "srd_id": r["srd_id"],
                "prd_section": r["prd_section"],
                "description": r["description"],
                "modules": r["sta_modules"],
                "asws_ref": r["asws_ref"],
                "aswui_ref": r["aswui_ref"],
                "aswis_ref": r["aswis_ref"],
                "coverage": coverage,
            })

        return {"items": items, "total": total, "limit": limit, "offset": offset}

    # ── Design Output Traceability ────────────────────────────────

    def get_design_outputs(self, project_id: int, limit: int = 100, offset: int = 0) -> dict:
        """Get design output documents with SRD counts."""
        rows = self._db.fetchall(
            "SELECT srd_id, design_refs_json FROM rtm_sta_design_outputs WHERE project_id = ?",
            (project_id,),
        )

        # Build ref -> set of SRD IDs
        ref_srds: dict[str, set] = {}
        total_srds_with_design = set()
        for r in rows:
            srd = r["srd_id"]
            total_srds_with_design.add(srd)
            try:
                refs = json.loads(r["design_refs_json"])
                for ref in refs:
                    ref_srds.setdefault(ref, set()).add(srd)
            except (json.JSONDecodeError, TypeError):
                pass

        # Sort by count descending
        sorted_refs = sorted(ref_srds.items(), key=lambda x: -len(x[1]))
        total_docs = len(sorted_refs)

        # Avg outputs per SRD
        total_srd_count = len(total_srds_with_design) or 1
        total_refs_sum = sum(len(s) for s in ref_srds.values())
        avg_per_srd = round(total_refs_sum / total_srd_count, 1) if total_srd_count else 0

        # Paginate
        page = sorted_refs[offset:offset + limit]
        max_count = len(page[0][1]) if page else 1

        items = []
        for ref, srds in page:
            sample = sorted(srds)[:8]
            items.append({
                "design_ref": ref,
                "srd_count": len(srds),
                "percentage": round(len(srds) / total_srd_count * 100, 1),
                "sample_srds": sample,
            })

        return {
            "items": items,
            "total_documents": total_docs,
            "total_srd_coverage": len(total_srds_with_design),
            "avg_outputs_per_srd": avg_per_srd,
            "top_document": sorted_refs[0][0] if sorted_refs else "",
            "top_document_count": len(sorted_refs[0][1]) if sorted_refs else 0,
        }

    # ── Unit Test Coverage ────────────────────────────────────────

    def get_unit_tests(
        self,
        project_id: int,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """Get unit test files with SRD coverage counts."""
        rows = self._db.fetchall(
            "SELECT srd_id, unit_test_files_json FROM rtm_sta_design_outputs WHERE project_id = ?",
            (project_id,),
        )

        # Build file -> set of SRD IDs
        file_srds: dict[str, set] = {}
        total_srds_with_ut = set()
        for r in rows:
            srd = r["srd_id"]
            try:
                files = json.loads(r["unit_test_files_json"])
                if files:
                    total_srds_with_ut.add(srd)
                for f in files:
                    file_srds.setdefault(f, set()).add(srd)
            except (json.JSONDecodeError, TypeError):
                pass

        # Filter by search
        if search:
            s = search.lower()
            file_srds = {k: v for k, v in file_srds.items() if s in k.lower()}

        # Sort by count descending
        sorted_files = sorted(file_srds.items(), key=lambda x: -len(x[1]))
        total_files = len(sorted_files)
        total_srd_count = len(total_srds_with_ut) or 1
        max_count = len(sorted_files[0][1]) if sorted_files else 1

        # Category breakdown
        categories: dict[str, int] = {}
        for fname, srds in sorted_files:
            fl = fname.lower()
            if any(x in fl for x in ['display', 'menu', 'title', 'prompt', 'setup', 'input', 'anim', 'ui']):
                cat = "UI / Display"
            elif any(x in fl for x in ['mdd', 'dataset', 'dataelement', 'limits']):
                cat = "Data / MDD"
            elif any(x in fl for x in ['alarm', 'alert']):
                cat = "Alarm / Safety"
            elif any(x in fl for x in ['comm', 'can', 'ecom', 'link']):
                cat = "Protocol / Comm"
            elif any(x in fl for x in ['drive', 'calc', 'motor', 'pump']):
                cat = "Drive / Control"
            elif any(x in fl for x in ['bit', 'diag', 'board', 'flash', 'crc']):
                cat = "Hardware / BIT"
            else:
                cat = "Other"
            categories[cat] = categories.get(cat, 0) + 1

        # Distribution buckets
        distribution = {"700+": 0, "500-699": 0, "300-499": 0, "100-299": 0, "<100": 0}
        for _, srds in sorted_files:
            c = len(srds)
            if c >= 700:
                distribution["700+"] += 1
            elif c >= 500:
                distribution["500-699"] += 1
            elif c >= 300:
                distribution["300-499"] += 1
            elif c >= 100:
                distribution["100-299"] += 1
            else:
                distribution["<100"] += 1

        # Paginate
        page = sorted_files[offset:offset + limit]
        avg_per_srd = round(sum(len(s) for s in file_srds.values()) / total_srd_count, 1) if total_srd_count else 0

        items = []
        for fname, srds in page:
            items.append({
                "test_file": fname,
                "srd_count": len(srds),
                "percentage": round(len(srds) / total_srd_count * 100, 1),
            })

        return {
            "items": items,
            "total_files": total_files,
            "total_srds_covered": len(total_srds_with_ut),
            "max_coverage": max_count,
            "avg_tests_per_srd": avg_per_srd,
            "categories": categories,
            "distribution": distribution,
        }

    # ── Version Coverage ──────────────────────────────────────────

    def get_version_coverage(self, project_id: int) -> dict:
        """Get per-version coverage stats."""
        total = self._db.fetchone(
            "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_version_verification WHERE project_id = ?",
            (project_id,),
        )["c"]

        rows = self._db.fetchall(
            "SELECT version_label, COUNT(DISTINCT srd_id) as srd_count "
            "FROM rtm_sta_version_verification "
            "WHERE project_id = ? "
            "GROUP BY version_label ORDER BY version_label",
            (project_id,),
        )

        versions = []
        for r in rows:
            versions.append({
                "version_label": r["version_label"],
                "srd_count": r["srd_count"],
                "percentage": round(r["srd_count"] / total * 100, 1) if total else 0,
            })

        return {
            "total_srds": total,
            "versions": versions,
        }

    # ── Version Matrix (existing) ─────────────────────────────────

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
