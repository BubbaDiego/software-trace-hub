"""FMEA API routes — /api/fmea/*"""
from __future__ import annotations

import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from core.fmea_core import FMEACore

router = APIRouter(prefix="/api/fmea", tags=["fmea"])


def _fmea() -> FMEACore:
    return FMEACore()


@router.post("/import")
async def import_fmea(file: UploadFile = File(...)):
    """Upload and import a Software FMEA Excel file."""
    if not file.filename or not file.filename.endswith((".xlsx", ".xls", ".xlsm")):
        raise HTTPException(400, "File must be .xlsx, .xls, or .xlsm")

    tmp_dir = tempfile.mkdtemp(prefix="fmea_upload_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return _fmea().import_fmea(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"FMEA import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/summary")
async def get_fmea_summary():
    """Get FMEA import summary."""
    return _fmea().get_summary()


@router.get("/overview")
async def get_fmea_overview():
    """Get FMEA executive overview with breakdowns."""
    return _fmea().get_overview()


@router.get("/records")
async def get_fmea_records(
    product: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Query FMEA records with optional product filter and search."""
    return _fmea().get_records(product=product, search=search, limit=limit, offset=offset)


@router.get("/common-causes")
async def get_fmea_common_causes():
    """Get all FMEA common causes."""
    return _fmea().get_common_causes()


@router.get("/product-matrix")
async def get_fmea_product_matrix():
    """Get cross-product hazard matrix data."""
    return _fmea().get_product_matrix()
