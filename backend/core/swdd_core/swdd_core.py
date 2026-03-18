"""SWDDCore — facade for SW Detailed Design operations."""
from __future__ import annotations

from core.shared.database import SharedDatabase


class SWDDCore:
    """High-level facade for SWDD import and querying."""

    def __init__(self, db: SharedDatabase | None = None):
        self._db = db or SharedDatabase.get_instance()

    def import_swdd(self, file_path: str) -> dict:
        """Import a SW Detailed Design .docx file."""
        from .swdd_importer import import_swdd_docx
        return import_swdd_docx(file_path, db=self._db)

    def get_summary(self) -> dict:
        """Get SWDD import summary."""
        items = self._db.fetchone("SELECT COUNT(*) as c FROM swdd_items")["c"]
        units = self._db.fetchone("SELECT COUNT(*) as c FROM swdd_units")["c"]
        sections = self._db.fetchone("SELECT COUNT(*) as c FROM swdd_sections")["c"]
        asdd_count = self._db.fetchone(
            "SELECT COUNT(DISTINCT asdd_ref) as c FROM swdd_items WHERE asdd_ref != ''"
        )["c"]
        return {
            "items": items, "units": units, "sections": sections,
            "asdd_domains": asdd_count, "imported": items > 0,
        }

    def get_overview(self) -> dict:
        """Get SWDD executive overview."""
        items = self._db.fetchall(
            "SELECT * FROM swdd_items ORDER BY unit_count DESC"
        )
        items_list = [dict(r) for r in items]

        # Section type distribution
        type_dist = self._db.fetchall(
            "SELECT section_type, COUNT(*) as cnt FROM swdd_items "
            "WHERE section_type != '' GROUP BY section_type ORDER BY cnt DESC"
        )

        # Heading level distribution
        level_dist = self._db.fetchall(
            "SELECT heading_level, COUNT(*) as cnt FROM swdd_sections "
            "GROUP BY heading_level ORDER BY heading_level"
        )

        # Items with vs without units
        with_units = sum(1 for i in items_list if i["unit_count"] > 0)
        total_units = self._db.fetchone("SELECT COUNT(*) as c FROM swdd_units")["c"]

        # Parent section breakdown
        parent_dist = self._db.fetchall(
            "SELECT parent_section, COUNT(*) as cnt FROM swdd_items "
            "GROUP BY parent_section ORDER BY cnt DESC"
        )

        # Items with various content types
        with_interfaces = sum(1 for i in items_list if i["external_interface"])
        with_risks = sum(1 for i in items_list if i["risks"])
        with_tests = sum(1 for i in items_list if i["test_areas"])
        with_assumptions = sum(1 for i in items_list if i["assumptions"])

        return {
            "total_items": len(items_list),
            "total_units": total_units,
            "total_sections": self._db.fetchone("SELECT COUNT(*) as c FROM swdd_sections")["c"],
            "with_units": with_units,
            "without_units": len(items_list) - with_units,
            "with_interfaces": with_interfaces,
            "with_risks": with_risks,
            "with_test_areas": with_tests,
            "with_assumptions": with_assumptions,
            "type_distribution": [dict(r) for r in type_dist],
            "level_distribution": [dict(r) for r in level_dist],
            "parent_distribution": [dict(r) for r in parent_dist],
        }

    def get_items(self, section_type: str | None = None, search: str | None = None,
                  limit: int = 200, offset: int = 0) -> dict:
        """Get software items with optional filtering."""
        conditions = ["1=1"]
        params: list = []

        if section_type:
            conditions.append("section_type = ?")
            params.append(section_type)

        if search:
            conditions.append("(name LIKE ? OR asdd_ref LIKE ? OR full_title LIKE ?)")
            like = f"%{search}%"
            params.extend([like, like, like])

        where = " AND ".join(conditions)
        total = self._db.fetchone(
            f"SELECT COUNT(*) as c FROM swdd_items WHERE {where}", tuple(params)
        )["c"]

        query_params = list(params) + [limit, offset]
        rows = self._db.fetchall(
            f"SELECT * FROM swdd_items WHERE {where} ORDER BY unit_count DESC LIMIT ? OFFSET ?",
            tuple(query_params),
        )
        return {"items": [dict(r) for r in rows], "total": total}

    def get_item_detail(self, item_id: int) -> dict | None:
        """Get a single software item with its units."""
        item = self._db.fetchone("SELECT * FROM swdd_items WHERE id = ?", (item_id,))
        if not item:
            return None
        result = dict(item)
        units = self._db.fetchall(
            "SELECT * FROM swdd_units WHERE item_id = ? ORDER BY name", (item_id,)
        )
        result["units"] = [dict(u) for u in units]

        # Cross-link: find STA design outputs matching this ASDD ref
        if result["asdd_ref"]:
            sta_count = self._db.fetchone(
                "SELECT COUNT(*) as c FROM rtm_sta_design_outputs "
                "WHERE design_refs_json LIKE ?",
                (f'%{result["asdd_ref"]}%',),
            )["c"]
            result["sta_linked_requirements"] = sta_count
        else:
            result["sta_linked_requirements"] = 0

        return result

    def get_units(self, search: str | None = None, limit: int = 100, offset: int = 0) -> dict:
        """Get software units with optional search."""
        conditions = ["1=1"]
        params: list = []
        if search:
            conditions.append("(u.name LIKE ? OR u.asdd_ref LIKE ?)")
            like = f"%{search}%"
            params.extend([like, like])

        where = " AND ".join(conditions)
        total = self._db.fetchone(
            f"SELECT COUNT(*) as c FROM swdd_units u WHERE {where}", tuple(params)
        )["c"]

        query_params = list(params) + [limit, offset]
        rows = self._db.fetchall(
            f"SELECT u.*, i.name as item_name FROM swdd_units u "
            f"JOIN swdd_items i ON i.id = u.item_id "
            f"WHERE {where} ORDER BY i.name, u.name LIMIT ? OFFSET ?",
            tuple(query_params),
        )
        return {"items": [dict(r) for r in rows], "total": total}

    def get_architecture_tree(self) -> dict:
        """Get the full item → unit hierarchy tree."""
        items = self._db.fetchall(
            "SELECT id, asdd_ref, name, section_type, unit_count, parent_section "
            "FROM swdd_items ORDER BY parent_section, name"
        )
        units = self._db.fetchall(
            "SELECT id, item_id, name, asdd_ref FROM swdd_units ORDER BY name"
        )

        # Group units by item_id
        unit_map: dict[int, list] = {}
        for u in units:
            unit_map.setdefault(u["item_id"], []).append(dict(u))

        tree = {}
        for item in items:
            parent = item["parent_section"] or "Other"
            if parent not in tree:
                tree[parent] = []
            tree[parent].append({
                **dict(item),
                "units": unit_map.get(item["id"], []),
            })

        return {"tree": tree, "total_items": len(items), "total_units": len(units)}

    def get_cross_references(self) -> dict:
        """Get ASDD cross-references between SWDD items and STA design outputs."""
        items = self._db.fetchall(
            "SELECT id, asdd_ref, name, unit_count FROM swdd_items WHERE asdd_ref != '' ORDER BY name"
        )

        refs = []
        for item in items:
            asdd = item["asdd_ref"]
            # Count STA design output linkages
            sta_count = self._db.fetchone(
                "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_design_outputs "
                "WHERE design_refs_json LIKE ?",
                (f'%ASDD-{asdd}%',),
            )["c"]

            # Count unit test linkages (rough match)
            ut_count = self._db.fetchone(
                "SELECT COUNT(DISTINCT srd_id) as c FROM rtm_sta_design_outputs "
                "WHERE unit_test_files_json LIKE ?",
                (f'%ut_{asdd.lower()}%',),
            )["c"]

            refs.append({
                "asdd_ref": asdd,
                "item_name": item["name"],
                "unit_count": item["unit_count"],
                "sta_requirement_links": sta_count,
                "ut_file_links": ut_count,
                "linked": sta_count > 0,
            })

        linked = sum(1 for r in refs if r["linked"])
        return {
            "items": sorted(refs, key=lambda x: -x["sta_requirement_links"]),
            "total": len(refs),
            "linked": linked,
            "unlinked": len(refs) - linked,
        }
