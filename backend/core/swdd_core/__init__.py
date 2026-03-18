"""SWDD Core — Software Detailed Design document management."""

from core.shared.database import SharedDatabase

# Register SWDD schema
SharedDatabase.register_schema("""
CREATE TABLE IF NOT EXISTS swdd_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    asdd_ref        TEXT NOT NULL DEFAULT '',
    name            TEXT NOT NULL DEFAULT '',
    full_title      TEXT NOT NULL DEFAULT '',
    section_type    TEXT NOT NULL DEFAULT '',
    parent_section  TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    external_interface TEXT NOT NULL DEFAULT '',
    assumptions     TEXT NOT NULL DEFAULT '',
    risks           TEXT NOT NULL DEFAULT '',
    test_areas      TEXT NOT NULL DEFAULT '',
    unit_count      INTEGER NOT NULL DEFAULT 0,
    heading_level   INTEGER NOT NULL DEFAULT 2,
    heading_path    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_swdd_item_asdd ON swdd_items(asdd_ref);
CREATE INDEX IF NOT EXISTS idx_swdd_item_name ON swdd_items(name);

CREATE TABLE IF NOT EXISTS swdd_units (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id         INTEGER NOT NULL,
    asdd_ref        TEXT NOT NULL DEFAULT '',
    name            TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    heading_path    TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (item_id) REFERENCES swdd_items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_swdd_unit_item ON swdd_units(item_id);
CREATE INDEX IF NOT EXISTS idx_swdd_unit_name ON swdd_units(name);
CREATE INDEX IF NOT EXISTS idx_swdd_unit_asdd ON swdd_units(asdd_ref);

CREATE TABLE IF NOT EXISTS swdd_sections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    heading_level   INTEGER NOT NULL DEFAULT 1,
    heading_text    TEXT NOT NULL DEFAULT '',
    heading_path    TEXT NOT NULL DEFAULT '',
    parent_path     TEXT NOT NULL DEFAULT '',
    asdd_ref        TEXT NOT NULL DEFAULT '',
    section_type    TEXT NOT NULL DEFAULT '',
    content_preview TEXT NOT NULL DEFAULT '',
    word_count      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_swdd_sec_level ON swdd_sections(heading_level);
CREATE INDEX IF NOT EXISTS idx_swdd_sec_asdd ON swdd_sections(asdd_ref);
CREATE INDEX IF NOT EXISTS idx_swdd_sec_path ON swdd_sections(heading_path);
""")

from .swdd_core import SWDDCore

__all__ = ["SWDDCore"]
