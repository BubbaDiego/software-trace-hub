"""RTM API routes — /api/rtm/*

Fully self-contained: no DataLocker dependency. Uses RTMCore + RTMDatabase directly.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from core.rtm_core import RTMCore

router = APIRouter(prefix="/api/rtm", tags=["rtm"])


def _rtm() -> RTMCore:
    return RTMCore()


# ── Projects ───────────────────────────────────────────────────────

@router.get("/projects")
async def list_projects():
    """List all imported RTM projects."""
    return _rtm().list_projects()


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int):
    """Delete a project and all associated data."""
    if not _rtm().delete_project(project_id):
        raise HTTPException(404, "Project not found")
    return {"status": "deleted", "project_id": project_id}


# ── Import ─────────────────────────────────────────────────────────

@router.post("/import")
async def import_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Query(None, description="Sheet to import (auto-detects if omitted)"),
    project_name: Optional[str] = Query("", description="Display name"),
    project_version: Optional[str] = Query("", description="Version string"),
):
    """Upload and import an RTM Excel file (.xlsx).

    Parses the spreadsheet, creates requirement and evidence records,
    runs gap analysis, and takes an initial snapshot.
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "File must be .xlsx or .xls")

    # Save upload to temp file
    tmp_dir = tempfile.mkdtemp(prefix="rtm_upload_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        result = _rtm().import_excel(
            file_path=tmp_path,
            sheet_name=sheet_name,
            project_name=project_name or "",
            project_version=project_version or "",
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.post("/import-path")
async def import_excel_by_path(
    file_path: str = Query(..., description="Local file path to Excel"),
    sheet_name: Optional[str] = Query(None),
    project_name: Optional[str] = Query(""),
    project_version: Optional[str] = Query(""),
):
    """Import an RTM Excel file from a local path (dev/CLI use)."""
    if not os.path.isfile(file_path):
        raise HTTPException(404, f"File not found: {file_path}")

    try:
        result = _rtm().import_excel(
            file_path=file_path,
            sheet_name=sheet_name,
            project_name=project_name or "",
            project_version=project_version or "",
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Import failed: {e}")


@router.post("/import-bundled")
async def import_bundled_excel(
    project_name: Optional[str] = Query("Alaris v12.6", description="Display name"),
    project_version: Optional[str] = Query("510k", description="Version string"),
):
    """Import the bundled RTM Excel file shipped with the app."""
    bundled = os.path.join(
        os.path.dirname(__file__), "..", "core", "rtm_core",
        "Embedded RTM - Alaris v12.6 510k.xlsx"
    )
    bundled = os.path.normpath(bundled)
    if not os.path.isfile(bundled):
        raise HTTPException(404, f"Bundled Excel not found at: {bundled}")

    try:
        result = _rtm().import_excel(
            file_path=bundled,
            sheet_name=None,
            project_name=project_name or "Alaris v12.6",
            project_version=project_version or "510k",
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Import failed: {e}")


# ── STA Import (enrichment) ────────────────────────────────────────

@router.post("/sta-import/{project_id}")
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

        result = _rtm().import_sta(
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


@router.post("/sta-import-bundled/{project_id}")
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
        return _rtm().import_sta(file_path=bundled, project_id=project_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"STA import failed: {e}")


@router.get("/sta-summary/{project_id}")
async def get_sta_summary(project_id: int):
    """Get STA enrichment summary for a project."""
    return _rtm().get_sta_summary(project_id)


@router.get("/sta-versions/{project_id}")
async def get_version_matrix(
    project_id: int,
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Query version verification matrix."""
    return _rtm().get_version_matrix(
        project_id, limit=limit, offset=offset, search=search
    )


# ── Overview / Stats ───────────────────────────────────────────────

@router.get("/overview/{project_id}")
async def get_overview(project_id: int):
    """Executive overview dashboard data."""
    try:
        ov = _rtm().get_overview(project_id)
        return ov.dict() if hasattr(ov, "dict") else ov
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/modules/{project_id}")
async def get_module_coverage(project_id: int):
    """Per-module coverage breakdown."""
    modules = _rtm().get_module_coverage(project_id)
    return [m.dict() if hasattr(m, "dict") else m for m in modules]


@router.get("/heatmap/{project_id}")
async def get_heatmap(
    project_id: int,
    top_n: int = Query(15, ge=1, le=60),
):
    """Feature x Module coverage heatmap."""
    return _rtm().get_heatmap(project_id, top_n)


@router.get("/features/{project_id}")
async def get_features(project_id: int):
    """Feature list with requirement counts."""
    ov = _rtm().get_overview(project_id)
    return {"features": ov.features, "total": ov.feature_count}


# ── Requirements ───────────────────────────────────────────────────

@router.get("/requirements")
async def get_requirements(
    project_id: int = Query(...),
    feature: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    trace_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Paginated, filterable requirement list."""
    return _rtm().get_requirements(
        project_id=project_id,
        feature=feature,
        module=module,
        trace_status=trace_status,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/requirements/{requirement_id}")
async def get_requirement_detail(requirement_id: int):
    """Single requirement with full evidence and gap details."""
    result = _rtm().get_requirement_detail(requirement_id)
    if not result:
        raise HTTPException(404, "Requirement not found")
    return result


# ── Gap Analysis ───────────────────────────────────────────────────

@router.get("/gaps/{project_id}")
async def get_gaps(
    project_id: int,
    gap_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Query gaps with filters, sorted by priority."""
    return _rtm().get_gaps(
        project_id=project_id,
        gap_type=gap_type,
        priority=priority,
        module=module,
        limit=limit,
        offset=offset,
    )


@router.post("/gaps/{project_id}/refresh")
async def refresh_gap_analysis(project_id: int):
    """Re-run gap analysis for a project."""
    return _rtm().run_gap_analysis(project_id)


@router.patch("/gaps/item/{gap_id}")
async def update_gap(
    gap_id: int,
    assigned_to: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    resolved: bool = Query(False),
):
    """Update a gap: assign owner, add notes, or resolve."""
    result = _rtm().update_gap(
        gap_id=gap_id,
        assigned_to=assigned_to,
        notes=notes,
        resolved=resolved,
    )
    if not result:
        raise HTTPException(404, "Gap not found")
    return result


# ── Snapshots ──────────────────────────────────────────────────────

@router.get("/snapshots/{project_id}")
async def get_snapshots(project_id: int):
    """Coverage snapshots over time."""
    return _rtm().get_snapshots(project_id)


@router.post("/snapshots/{project_id}")
async def take_snapshot(project_id: int):
    """Take a new coverage snapshot."""
    snap = _rtm().take_snapshot(project_id)
    return snap.dict() if hasattr(snap, "dict") else snap


# ── Export ─────────────────────────────────────────────────────────

@router.get("/export/{project_id}")
async def export_project(
    project_id: int,
    format: str = Query("json", regex="^(json|csv)$"),
):
    """Export project data as JSON or CSV."""
    rtm = _rtm()

    try:
        overview = rtm.get_overview(project_id)
    except ValueError:
        raise HTTPException(404, "Project not found")

    if format == "json":
        reqs = rtm.get_requirements(project_id, limit=10000)
        gaps = rtm.get_gaps(project_id, limit=10000)
        modules = rtm.get_module_coverage(project_id)
        return {
            "overview": overview.dict() if hasattr(overview, "dict") else overview,
            "requirements": reqs,
            "gaps": gaps,
            "modules": [m.dict() if hasattr(m, "dict") else m for m in modules],
        }

    # CSV format
    import csv
    import io
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "SNO", "SRD_ID", "Feature", "Sub_Feature", "Function",
        "Impacted_Modules", "Spec_ID", "Hazard_ID", "Trace_Status",
        "Evidence_Count", "Gap_Types",
    ])

    reqs = rtm.get_requirements(project_id, limit=10000)
    for item in reqs["items"]:
        gap_types = ""
        detail = rtm.get_requirement_detail(item["id"])
        if detail and detail.get("gaps"):
            gap_types = ", ".join(g["gap_type"] for g in detail["gaps"])

        writer.writerow([
            item.get("sno", ""),
            item.get("srd_id", ""),
            item.get("feature", ""),
            item.get("sub_feature", ""),
            item.get("software_function", ""),
            item.get("impacted_modules", ""),
            item.get("spec_id", ""),
            item.get("hazard_id", ""),
            item.get("trace_status", ""),
            len(item.get("evidence", [])),
            gap_types,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=rtm_project_{project_id}.csv"},
    )


# ── FMEA Import ───────────────────────────────────────────────────

@router.post("/fmea/import")
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
        return _rtm().import_fmea(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"FMEA import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/fmea/summary")
async def get_fmea_summary():
    """Get FMEA import summary."""
    return _rtm().get_fmea_summary()


@router.get("/fmea/overview")
async def get_fmea_overview():
    """Get FMEA executive overview with breakdowns."""
    return _rtm().get_fmea_overview()


@router.get("/fmea/records")
async def get_fmea_records(
    product: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Query FMEA records with optional product filter and search."""
    return _rtm().get_fmea_records(product=product, search=search, limit=limit, offset=offset)


@router.get("/fmea/common-causes")
async def get_fmea_common_causes():
    """Get all FMEA common causes."""
    return _rtm().get_fmea_common_causes()


@router.get("/fmea/product-matrix")
async def get_fmea_product_matrix():
    """Get cross-product hazard matrix data."""
    return _rtm().get_fmea_product_matrix()


# ── Resource Import ───────────────────────────────────────────────

@router.post("/resources/import")
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
        return _rtm().import_resources(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Resource import failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/resources/summary")
async def get_resource_summary():
    """Get resource import summary."""
    return _rtm().get_resource_summary()
