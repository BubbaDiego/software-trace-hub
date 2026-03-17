"""Resource Core — Resource planning and allocation management."""

from core.shared.database import SharedDatabase

# Register Resource schema
SharedDatabase.register_schema("""
CREATE TABLE IF NOT EXISTS resource_people (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT 'FTE',
    team        TEXT NOT NULL DEFAULT '',
    location    TEXT NOT NULL DEFAULT '',
    manager     TEXT NOT NULL DEFAULT '',
    project     TEXT NOT NULL DEFAULT '',
    activity    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_res_people_name ON resource_people(name);
CREATE INDEX IF NOT EXISTS idx_res_people_team ON resource_people(team);

CREATE TABLE IF NOT EXISTS resource_allocations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name  TEXT NOT NULL DEFAULT '',
    project      TEXT NOT NULL DEFAULT '',
    month        TEXT NOT NULL DEFAULT '',
    allocation   REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_res_alloc_name ON resource_allocations(person_name);
CREATE INDEX IF NOT EXISTS idx_res_alloc_month ON resource_allocations(month);
""")

from .resource_core import ResourceCore

__all__ = ["ResourceCore"]
