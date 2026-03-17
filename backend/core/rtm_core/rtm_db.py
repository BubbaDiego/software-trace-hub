"""RTM database — now delegates to SharedDatabase.

This module registers the RTM-specific schema and provides a backward-compatible
RTMDatabase alias so existing imports continue to work.
"""
from __future__ import annotations

from core.shared.database import SharedDatabase

# Register RTM schema (must be registered before STA schema due to FK refs)
SharedDatabase.register_schema("""
CREATE TABLE IF NOT EXISTS rtm_projects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL DEFAULT '',
    version         TEXT NOT NULL DEFAULT '',
    sheet_name      TEXT NOT NULL DEFAULT '',
    uploaded_at     TEXT NOT NULL DEFAULT (datetime('now')),
    file_hash       TEXT NOT NULL DEFAULT '',
    total_requirements INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rtm_requirements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL,
    sno             INTEGER,
    composite_key   TEXT NOT NULL DEFAULT '',
    software_feature TEXT NOT NULL DEFAULT '',
    feature         TEXT NOT NULL DEFAULT '',
    sub_feature     TEXT NOT NULL DEFAULT '',
    software_function TEXT NOT NULL DEFAULT '',
    tracker_id      TEXT NOT NULL DEFAULT '',
    hazard_id       TEXT NOT NULL DEFAULT '',
    srd_id          TEXT NOT NULL DEFAULT '',
    impacted_modules TEXT NOT NULL DEFAULT '',
    prd_modules     TEXT NOT NULL DEFAULT '',
    srs_id          TEXT NOT NULL DEFAULT '',
    spec_id         TEXT NOT NULL DEFAULT '',
    project_status  TEXT NOT NULL DEFAULT '',
    comment         TEXT NOT NULL DEFAULT '',
    trace_status    TEXT NOT NULL DEFAULT 'missing',
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rtm_req_project ON rtm_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_rtm_req_srd ON rtm_requirements(srd_id);
CREATE INDEX IF NOT EXISTS idx_rtm_req_feature ON rtm_requirements(feature);
CREATE INDEX IF NOT EXISTS idx_rtm_req_hazard ON rtm_requirements(hazard_id);
CREATE INDEX IF NOT EXISTS idx_rtm_req_trace ON rtm_requirements(trace_status);

CREATE TABLE IF NOT EXISTS rtm_test_evidence (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    evidence_type   TEXT NOT NULL DEFAULT '',
    module_name     TEXT NOT NULL DEFAULT '',
    tc_ids_json     TEXT NOT NULL DEFAULT '[]',
    tc_count        INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rtm_ev_req ON rtm_test_evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_rtm_ev_type ON rtm_test_evidence(evidence_type);

CREATE TABLE IF NOT EXISTS rtm_gap_analysis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,
    srd_id          TEXT NOT NULL DEFAULT '',
    feature         TEXT NOT NULL DEFAULT '',
    module          TEXT NOT NULL DEFAULT '',
    gap_type        TEXT NOT NULL DEFAULT 'no_tests',
    priority        TEXT NOT NULL DEFAULT 'P3',
    assigned_to     TEXT NOT NULL DEFAULT '',
    notes           TEXT NOT NULL DEFAULT '',
    resolved_at     TEXT,
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rtm_gap_project ON rtm_gap_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_rtm_gap_priority ON rtm_gap_analysis(priority);
CREATE INDEX IF NOT EXISTS idx_rtm_gap_type ON rtm_gap_analysis(gap_type);

CREATE TABLE IF NOT EXISTS rtm_hazards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL,
    hazard_id       TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    severity        TEXT NOT NULL DEFAULT '',
    probability     TEXT NOT NULL DEFAULT '',
    risk_level      TEXT NOT NULL DEFAULT '',
    mitigation_status TEXT NOT NULL DEFAULT '',
    linked_requirement_ids_json TEXT NOT NULL DEFAULT '[]',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rtm_snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL,
    snapshot_date   TEXT NOT NULL DEFAULT (date('now')),
    total_reqs      INTEGER NOT NULL DEFAULT 0,
    covered         INTEGER NOT NULL DEFAULT 0,
    partial         INTEGER NOT NULL DEFAULT 0,
    missing         INTEGER NOT NULL DEFAULT 0,
    cats_count      INTEGER NOT NULL DEFAULT 0,
    manual_count    INTEGER NOT NULL DEFAULT 0,
    gap_count       INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);
""")

# Backward-compatible alias — existing code that imports RTMDatabase will work
RTMDatabase = SharedDatabase
