"""Resource API routes — /api/resources/*"""
from __future__ import annotations

import os
import shutil
import tempfile

from fastapi import APIRouter, HTTPException, UploadFile, File

from core.resource_core import ResourceCore

router = APIRouter(prefix="/api/resources", tags=["resources"])


def _resources() -> ResourceCore:
    return ResourceCore()


@router.post("/import")
async def import_resources(file: UploadFile = File(...)):
    """Upload and import a resource planning Excel file."""
    if not file.filename or not file.filename.endswith((".xlsx", ".xls", ".xlsm")):
        raise HTTPException(400, "File must be .xlsx, .xls, or .xlsm")

    tmp_dir = tempfile.mkdtemp(prefix="res_upload_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return _resources().import_resources(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Resource import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/summary")
async def get_resource_summary():
    """Get resource import summary."""
    return _resources().get_summary()
