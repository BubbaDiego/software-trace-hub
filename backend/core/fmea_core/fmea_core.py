"""FMEACore — facade for all FMEA operations."""
from __future__ import annotations

from core.shared.database import SharedDatabase


class FMEACore:
    """High-level facade for FMEA import and querying."""

    def __init__(self, db: SharedDatabase | None = None):
        self._db = db or SharedDatabase.get_instance()

    def import_fmea(self, file_path: str, sheet_name: str | None = None) -> dict:
        """Import an FMEA Excel file."""
        from .fmea_importer import import_fmea_excel
        return import_fmea_excel(file_path, sheet_name=sheet_name, db=self._db)

    def get_summary(self) -> dict:
        """Get FMEA import summary."""
        count = self._db.fetchone("SELECT COUNT(*) as c FROM fmea_records")["c"]
        cc_count = self._db.fetchone("SELECT COUNT(*) as c FROM fmea_common_causes")["c"]
        return {"fmea_records": count, "common_causes": cc_count, "imported": count > 0}

    def get_overview(self) -> dict:
        """Get FMEA executive overview stats."""
        total = self._db.fetchone("SELECT COUNT(*) as c FROM fmea_records")["c"]
        hazards = self._db.fetchone("SELECT COUNT(DISTINCT hazard) as c FROM fmea_records WHERE hazard != ''")["c"]
        failure_modes = self._db.fetchone("SELECT COUNT(DISTINCT failure_mode) as c FROM fmea_records WHERE failure_mode != ''")["c"]
        critical = self._db.fetchone("SELECT COUNT(*) as c FROM fmea_records WHERE critical_component LIKE '%yes%' OR critical_component LIKE '%Yes%'")["c"]
        common_causes = self._db.fetchone("SELECT COUNT(*) as c FROM fmea_common_causes")["c"]

        products = self._db.fetchall(
            "SELECT product, COUNT(*) as count FROM fmea_records WHERE product != '' GROUP BY product ORDER BY count DESC"
        )
        rcm_types = self._db.fetchall(
            "SELECT rcm_type, COUNT(*) as count FROM fmea_records WHERE rcm_type != '' GROUP BY rcm_type ORDER BY count DESC"
        )
        hazard_cats = self._db.fetchall(
            "SELECT SUBSTR(hazard, 1, 6) as category, COUNT(*) as count FROM fmea_records WHERE hazard != '' GROUP BY category ORDER BY count DESC"
        )

        return {
            "total": total,
            "distinct_hazards": hazards,
            "distinct_failure_modes": failure_modes,
            "critical_components": critical,
            "common_causes": common_causes,
            "products": [dict(r) for r in products],
            "rcm_types": [dict(r) for r in rcm_types],
            "hazard_categories": [dict(r) for r in hazard_cats],
        }

    def get_records(self, product=None, search=None, limit=100, offset=0) -> dict:
        """Query FMEA records with filters."""
        conditions = ["1=1"]
        params = []

        if product:
            conditions.append("product = ?")
            params.append(product)

        if search:
            conditions.append(
                "(fmea_id LIKE ? OR failure_mode LIKE ? OR hazard LIKE ? OR component LIKE ? OR cause LIKE ?)"
            )
            like = f"%{search}%"
            params.extend([like, like, like, like, like])

        where = " AND ".join(conditions)
        total = self._db.fetchone(f"SELECT COUNT(*) as c FROM fmea_records WHERE {where}", tuple(params))["c"]

        query_params = list(params) + [limit, offset]
        rows = self._db.fetchall(
            f"SELECT * FROM fmea_records WHERE {where} ORDER BY id LIMIT ? OFFSET ?",
            tuple(query_params),
        )

        return {"items": [dict(r) for r in rows], "total": total, "limit": limit, "offset": offset}

    def get_common_causes(self) -> list:
        """Get all FMEA common causes."""
        rows = self._db.fetchall("SELECT * FROM fmea_common_causes ORDER BY module, id")
        return [dict(r) for r in rows]

    def get_product_matrix(self) -> dict:
        """Get cross-product hazard matrix data."""
        rows = self._db.fetchall(
            "SELECT product, SUBSTR(hazard, 1, 6) as hazard_cat, COUNT(*) as count "
            "FROM fmea_records WHERE product != '' AND hazard != '' "
            "GROUP BY product, hazard_cat ORDER BY product, count DESC"
        )

        products = []
        for r in self._db.fetchall("SELECT DISTINCT product FROM fmea_records WHERE product != '' ORDER BY product"):
            prod = r["product"]
            prod_rows = self._db.fetchall(
                "SELECT COUNT(*) as total, "
                "SUM(CASE WHEN critical_component LIKE '%yes%' OR critical_component LIKE '%Yes%' THEN 1 ELSE 0 END) as critical, "
                "COUNT(DISTINCT failure_mode) as failure_modes "
                "FROM fmea_records WHERE product = ?",
                (prod,)
            )
            pr = dict(prod_rows[0]) if prod_rows else {}
            pr["product"] = prod
            products.append(pr)

        return {
            "matrix": [dict(r) for r in rows],
            "products": products,
        }
