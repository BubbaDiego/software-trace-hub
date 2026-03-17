"""STA API routes — /api/sta/*"""
from __future__ import annotations

import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from core.sta_core import STACore

router = APIRouter(prefix="/api/sta", tags=["sta"])


def _sta() -> STACore:
    return STACore()


@router.post("/import/{project_id}")
async def import_sta(
    project_id: int,
    file: UploadFile = File(...),
    sw_trace_sheet: Optional[str] = Query(None),
    div_sheet: Optional[str] = Query(None),
):
    """Upload STA Excel to enrich an existing RTM project."""
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "File must be .xlsx or .xls")

    tmp_dir = tempfile.mkdtemp(prefix="sta_upload_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        result = _sta().import_sta(
            file_path=tmp_path,
            project_id=project_id,
            sw_trace_sheet=sw_trace_sheet,
            div_sheet=div_sheet,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"STA import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.post("/import-bundled/{project_id}")
async def import_bundled_sta(project_id: int):
    """Import the bundled STA Excel file to enrich an existing project."""
    bundled = os.path.join(
        os.path.dirname(__file__), "..", "core", "rtm_core",
        "Alaris System v12.6 Software Traceability Analysis.xlsx"
    )
    bundled = os.path.normpath(bundled)
    if not os.path.isfile(bundled):
        raise HTTPException(404, f"Bundled STA file not found at: {bundled}")

    try:
        return _sta().import_sta(file_path=bundled, project_id=project_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"STA import failed: {e}")


@router.get("/summary/{project_id}")
async def get_sta_summary(project_id: int):
    """Get STA enrichment summary for a project."""
    return _sta().get_summary(project_id)


@router.get("/versions/{project_id}")
async def get_version_matrix(
    project_id: int,
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Query version verification matrix."""
    return _sta().get_version_matrix(
        project_id, limit=limit, offset=offset, search=search
    )
