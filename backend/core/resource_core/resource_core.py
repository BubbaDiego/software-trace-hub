"""ResourceCore — facade for all resource planning operations."""
from __future__ import annotations

from core.shared.database import SharedDatabase


class ResourceCore:
    """High-level facade for resource import and querying."""

    def __init__(self, db: SharedDatabase | None = None):
        self._db = db or SharedDatabase.get_instance()

    def import_resources(self, file_path: str, sheet_name: str | None = None) -> dict:
        """Import a resource planning Excel file."""
        from .resource_importer import import_resource_excel
        return import_resource_excel(file_path, sheet_name=sheet_name, db=self._db)

    def get_summary(self) -> dict:
        """Get resource import summary."""
        people = self._db.fetchone("SELECT COUNT(*) as c FROM resource_people")["c"]
        allocs = self._db.fetchone("SELECT COUNT(*) as c FROM resource_allocations")["c"]
        return {"people_count": people, "allocation_rows": allocs, "imported": people > 0}
