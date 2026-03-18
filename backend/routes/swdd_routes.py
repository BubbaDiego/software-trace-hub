"""SWDD API routes — /api/swdd/*"""
from __future__ import annotations

import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from core.swdd_core import SWDDCore

router = APIRouter(prefix="/api/swdd", tags=["swdd"])


def _swdd() -> SWDDCore:
    return SWDDCore()


@router.post("/import")
async def import_swdd(file: UploadFile = File(...)):
    """Upload and import a SW Detailed Design .docx file."""
    if not file.filename or not file.filename.endswith((".docx",)):
        raise HTTPException(400, "File must be .docx")

    tmp_dir = tempfile.mkdtemp(prefix="swdd_upload_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return _swdd().import_swdd(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"SWDD import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/summary")
async def get_summary():
    return _swdd().get_summary()


@router.get("/overview")
async def get_overview():
    return _swdd().get_overview()


@router.get("/items")
async def get_items(
    section_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    return _swdd().get_items(section_type=section_type, search=search, limit=limit, offset=offset)


@router.get("/items/{item_id}")
async def get_item_detail(item_id: int):
    result = _swdd().get_item_detail(item_id)
    if not result:
        raise HTTPException(404, "Item not found")
    return result


@router.get("/units")
async def get_units(
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    return _swdd().get_units(search=search, limit=limit, offset=offset)


@router.get("/architecture")
async def get_architecture():
    return _swdd().get_architecture_tree()


@router.get("/cross-references")
async def get_cross_references():
    return _swdd().get_cross_references()
