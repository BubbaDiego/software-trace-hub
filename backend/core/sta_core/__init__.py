"""STA Core — Software Traceability Analysis management."""

from core.shared.database import SharedDatabase

# Register STA schema (tables reference rtm_requirements/rtm_projects via FK)
SharedDatabase.register_schema("""
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
""")

from .sta_core import STACore

__all__ = ["STACore"]
