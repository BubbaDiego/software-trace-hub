"""Shared SQLite database — singleton used by all domain cores.

Each domain registers its own schema DDL via SharedDatabase.register_schema().
All domains share a single rtm.db file so cross-domain joins are possible.
"""
from __future__ import annotations

import os
import sqlite3
import threading
from pathlib import Path


# Default location: backend/data/rtm.db
_DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "rtm.db"
)


class SharedDatabase:
    """Lightweight SQLite wrapper shared across all domain cores.

    Schema registration:
        Each domain core calls SharedDatabase.register_schema(ddl) at import time.
        When get_instance() is first called, all registered schemas are applied.
    """

    _instance: SharedDatabase | None = None
    _lock = threading.RLock()
    _schema_registry: list[str] = []

    def __init__(self, db_path: str | None = None):
        self.db_path = Path(db_path or _DEFAULT_DB_PATH).resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn: sqlite3.Connection | None = None
        self._conn_lock = threading.RLock()
        self._connect()
        self._ensure_schema()

    @classmethod
    def register_schema(cls, ddl: str):
        """Register a DDL block to be applied when the database is initialized."""
        cls._schema_registry.append(ddl)

    @classmethod
    def get_instance(cls, db_path: str | None = None) -> SharedDatabase:
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
        """Apply all registered schema DDL blocks."""
        with self._conn_lock:
            for ddl in self._schema_registry:
                self.conn.executescript(ddl)
            # Migration: add sta_enriched_at to rtm_projects if missing
            try:
                cols = {
                    row[1]
                    for row in self.conn.execute(
                        "PRAGMA table_info(rtm_projects)"
                    ).fetchall()
                }
                if cols and "sta_enriched_at" not in cols:
                    self.conn.execute(
                        "ALTER TABLE rtm_projects ADD COLUMN sta_enriched_at TEXT DEFAULT NULL"
                    )
            except Exception:
                pass  # table may not exist yet on first run
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
