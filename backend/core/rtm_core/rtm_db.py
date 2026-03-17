"""RTM database — standalone SQLite for RTM data, fully independent of mother.db."""
from __future__ import annotations

import os
import sqlite3
import threading
from pathlib import Path


# Default location: backend/data/rtm.db
_DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "rtm.db"
)


class RTMDatabase:
    """Lightweight SQLite wrapper for RTM data. Mirrors DatabaseManager patterns
    but is completely independent — no DataLocker dependency."""

    _instance: RTMDatabase | None = None
    _lock = threading.RLock()

    def __init__(self, db_path: str | None = None):
        self.db_path = Path(db_path or _DEFAULT_DB_PATH).resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn: sqlite3.Connection | None = None
        self._conn_lock = threading.RLock()
        self._connect()
        self._ensure_schema()

    @classmethod
    def get_instance(cls, db_path: str | None = None) -> RTMDatabase:
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls(db_path)
            return cls._instance

    def _connect(self):
        with self._conn_lock:
            if self.conn is not None:
                return
            self.conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
                timeout=15,
            )
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA journal_mode=WAL;")
            self.conn.execute("PRAGMA busy_timeout=10000;")
            self.conn.execute("PRAGMA foreign_keys=ON;")

    def _ensure_schema(self):
        """Create all RTM tables if they don't exist."""
        with self._conn_lock:
            self.conn.executescript(_SCHEMA_SQL)
            # Migrate: add sta_enriched_at to rtm_projects if missing
            cols = {
                row[1]
                for row in self.conn.execute(
                    "PRAGMA table_info(rtm_projects)"
                ).fetchall()
            }
            if "sta_enriched_at" not in cols:
                self.conn.execute(
                    "ALTER TABLE rtm_projects ADD COLUMN sta_enriched_at TEXT DEFAULT NULL"
                )
            self.conn.commit()

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        with self._conn_lock:
            return self.conn.execute(sql, params)

    def executemany(self, sql: str, params_list: list) -> sqlite3.Cursor:
        with self._conn_lock:
            return self.conn.executemany(sql, params_list)

    def commit(self):
        with self._conn_lock:
            self.conn.commit()

    def fetchone(self, sql: str, params: tuple = ()) -> sqlite3.Row | None:
        return self.execute(sql, params).fetchone()

    def fetchall(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        return self.execute(sql, params).fetchall()

    def close(self):
        with self._conn_lock:
            if self.conn:
                self.conn.close()
                self.conn = None


# ── Schema DDL ─────────────────────────────────────────────────────

_SCHEMA_SQL = """
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

-- STA Enrichment tables (Software Traceability Analysis)

CREATE TABLE IF NOT EXISTS rtm_sta_spec_refs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,
    srd_id          TEXT NOT NULL DEFAULT '',
    prd_section     TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    sta_modules     TEXT NOT NULL DEFAULT '',
    asws_ref        TEXT NOT NULL DEFAULT '',
    aswui_ref       TEXT NOT NULL DEFAULT '',
    aswis_ref       TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sta_spec_req ON rtm_sta_spec_refs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_sta_spec_srd ON rtm_sta_spec_refs(srd_id);

CREATE TABLE IF NOT EXISTS rtm_sta_module_evidence (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,
    srd_id          TEXT NOT NULL DEFAULT '',
    module_name     TEXT NOT NULL DEFAULT '',
    tc_ids_json     TEXT NOT NULL DEFAULT '[]',
    tc_count        INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sta_ev_req ON rtm_sta_module_evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_sta_ev_module ON rtm_sta_module_evidence(module_name);

CREATE TABLE IF NOT EXISTS rtm_sta_design_outputs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,
    srd_id          TEXT NOT NULL DEFAULT '',
    design_refs_json TEXT NOT NULL DEFAULT '[]',
    design_ref_count INTEGER NOT NULL DEFAULT 0,
    unit_test_files_json TEXT NOT NULL DEFAULT '[]',
    unit_test_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sta_design_req ON rtm_sta_design_outputs(requirement_id);

CREATE TABLE IF NOT EXISTS rtm_sta_version_verification (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id  INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,
    srd_id          TEXT NOT NULL DEFAULT '',
    version_label   TEXT NOT NULL DEFAULT '',
    test_ref        TEXT NOT NULL DEFAULT '',
    ter_ref         TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (requirement_id) REFERENCES rtm_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES rtm_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sta_ver_req ON rtm_sta_version_verification(requirement_id);
CREATE INDEX IF NOT EXISTS idx_sta_ver_version ON rtm_sta_version_verification(version_label);
CREATE INDEX IF NOT EXISTS idx_sta_ver_srd ON rtm_sta_version_verification(srd_id);

-- FMEA tables
CREATE TABLE IF NOT EXISTS fmea_records (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    fmea_id                     TEXT NOT NULL DEFAULT '',
    source                      TEXT NOT NULL DEFAULT '',
    hazard                      TEXT NOT NULL DEFAULT '',
    hazardous_situation         TEXT NOT NULL DEFAULT '',
    product                     TEXT NOT NULL DEFAULT '',
    system                      TEXT NOT NULL DEFAULT '',
    component                   TEXT NOT NULL DEFAULT '',
    critical_component          TEXT NOT NULL DEFAULT '',
    function                    TEXT NOT NULL DEFAULT '',
    failure_mode                TEXT NOT NULL DEFAULT '',
    failure_code                TEXT NOT NULL DEFAULT '',
    failure_code_desc           TEXT NOT NULL DEFAULT '',
    cause                       TEXT NOT NULL DEFAULT '',
    effect                      TEXT NOT NULL DEFAULT '',
    system_effect               TEXT NOT NULL DEFAULT '',
    rcm                         TEXT NOT NULL DEFAULT '',
    rcm_type                    TEXT NOT NULL DEFAULT '',
    requirement                 TEXT NOT NULL DEFAULT '',
    ui_spec                     TEXT NOT NULL DEFAULT '',
    evidence                    TEXT NOT NULL DEFAULT '',
    standard_ref                TEXT NOT NULL DEFAULT '',
    p1a                         TEXT NOT NULL DEFAULT '',
    p1b_p1c                     TEXT NOT NULL DEFAULT '',
    p1_sources                  TEXT NOT NULL DEFAULT '',
    p1                          TEXT NOT NULL DEFAULT '',
    poh                         TEXT NOT NULL DEFAULT '',
    mitigation_rationale        TEXT NOT NULL DEFAULT '',
    residual_p1a                TEXT NOT NULL DEFAULT '',
    residual_p1b_p1c            TEXT NOT NULL DEFAULT '',
    residual_p1_sources         TEXT NOT NULL DEFAULT '',
    residual_p1                 TEXT NOT NULL DEFAULT '',
    residual_hazardous_situation TEXT NOT NULL DEFAULT '',
    severity                    TEXT NOT NULL DEFAULT '',
    residual_poh                TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_fmea_id ON fmea_records(fmea_id);
CREATE INDEX IF NOT EXISTS idx_fmea_hazard ON fmea_records(hazard);

CREATE TABLE IF NOT EXISTS fmea_common_causes (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    module                TEXT NOT NULL DEFAULT '',
    common_cause          TEXT NOT NULL DEFAULT '',
    common_cause_failure  TEXT NOT NULL DEFAULT '',
    mitigation            TEXT NOT NULL DEFAULT '',
    reference             TEXT NOT NULL DEFAULT ''
);

-- Resource planning tables
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
"""
