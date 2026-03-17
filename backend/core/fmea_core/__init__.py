"""FMEA Core — Failure Mode and Effects Analysis management."""

from core.shared.database import SharedDatabase

# Register FMEA schema
SharedDatabase.register_schema("""
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
""")

from .fmea_core import FMEACore

__all__ = ["FMEACore"]
