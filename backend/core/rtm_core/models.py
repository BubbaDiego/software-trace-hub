"""RTM domain models — Requirements Traceability Matrix for 510(k) submissions."""
from __future__ import annotations

from enum import Enum
from typing import Optional, List
from datetime import datetime

try:
    from pydantic import BaseModel, Field
    if not hasattr(BaseModel, "__fields__"):
        raise ImportError("stub")
except Exception:  # pragma: no cover
    class BaseModel:
        def __init__(self, **data):
            for k, v in data.items():
                setattr(self, k, v)
        def dict(self) -> dict:
            return self.__dict__

    def Field(default=None, **_):
        return default


# ── Enums ──────────────────────────────────────────────────────────

class GapType(str, Enum):
    NO_TESTS = "no_tests"
    MANUAL_ONLY = "manual_only"
    NO_SPEC = "no_spec"
    SCENARIO_GAP = "scenario_gap"


class GapPriority(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class EvidenceType(str, Enum):
    SPEC_MANUAL = "spec_manual"
    REQ_MANUAL = "req_manual"
    MODULE_LVP_MANUAL = "module_lvp_manual"
    MODULE_SYR_MANUAL = "module_syr_manual"
    MODULE_PCA_MANUAL = "module_pca_manual"
    MODULE_PCU_MANUAL = "module_pcu_manual"
    MODULE_ETCO2_MANUAL = "module_etco2_manual"
    MODULE_SPO2_MANUAL = "module_spo2_manual"
    MODULE_AUTOID_MANUAL = "module_autoid_manual"
    CATS_SPEC = "cats_spec"
    CATS_REQ = "cats_req"
    CATS_MODULE_LVP = "cats_module_lvp"
    CATS_MODULE_SYR = "cats_module_syr"
    CATS_MODULE_PCA = "cats_module_pca"
    SCENARIO_MANUAL = "scenario_manual"
    SCENARIO_CATS = "scenario_cats"


class TraceStatus(str, Enum):
    FULL = "full"
    PARTIAL = "partial"
    MISSING = "missing"


# ── Models ─────────────────────────────────────────────────────────

class RTMProject(BaseModel):
    id: Optional[int] = None
    name: str = ""
    version: str = ""
    sheet_name: str = ""
    uploaded_at: Optional[str] = None
    file_hash: str = ""
    total_requirements: int = 0

    def __repr__(self):
        return f"RTMProject(id={self.id}, name={self.name!r}, version={self.version!r})"


class RTMRequirement(BaseModel):
    id: Optional[int] = None
    project_id: int = 0
    sno: Optional[int] = None
    composite_key: str = ""
    software_feature: str = ""
    feature: str = ""
    sub_feature: str = ""
    software_function: str = ""
    tracker_id: str = ""
    hazard_id: str = ""
    srd_id: str = ""
    impacted_modules: str = ""
    prd_modules: str = ""
    srs_id: str = ""
    spec_id: str = ""
    project_status: str = ""
    comment: str = ""
    trace_status: str = TraceStatus.MISSING.value

    def __repr__(self):
        return f"RTMRequirement(sno={self.sno}, srd={self.srd_id!r}, feature={self.feature!r})"

    @property
    def module_list(self) -> List[str]:
        if not self.impacted_modules:
            return []
        return [m.strip() for m in self.impacted_modules.split(",") if m.strip()]

    @property
    def has_hazard(self) -> bool:
        return bool(self.hazard_id and self.hazard_id.strip())


class RTMTestEvidence(BaseModel):
    id: Optional[int] = None
    requirement_id: int = 0
    evidence_type: str = ""
    module_name: str = ""
    tc_ids_json: str = "[]"
    tc_count: int = 0

    def __repr__(self):
        return f"RTMTestEvidence(req={self.requirement_id}, type={self.evidence_type}, count={self.tc_count})"


class RTMGap(BaseModel):
    id: Optional[int] = None
    requirement_id: int = 0
    project_id: int = 0
    srd_id: str = ""
    feature: str = ""
    module: str = ""
    gap_type: str = GapType.NO_TESTS.value
    priority: str = GapPriority.P3.value
    assigned_to: str = ""
    notes: str = ""
    resolved_at: Optional[str] = None

    def __repr__(self):
        return f"RTMGap(srd={self.srd_id!r}, type={self.gap_type}, priority={self.priority})"


class RTMHazard(BaseModel):
    """Placeholder for v2 hazard support. Table created now, populated later."""
    id: Optional[int] = None
    project_id: int = 0
    hazard_id: str = ""
    description: str = ""
    severity: str = ""
    probability: str = ""
    risk_level: str = ""
    mitigation_status: str = ""
    linked_requirement_ids_json: str = "[]"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class RTMSnapshot(BaseModel):
    id: Optional[int] = None
    project_id: int = 0
    snapshot_date: str = ""
    total_reqs: int = 0
    covered: int = 0
    partial: int = 0
    missing: int = 0
    cats_count: int = 0
    manual_count: int = 0
    gap_count: int = 0


# ── API response models ───────────────────────────────────────────

class RTMOverview(BaseModel):
    project: Optional[RTMProject] = None
    total_requirements: int = 0
    covered: int = 0
    partial: int = 0
    missing: int = 0
    coverage_pct: float = 0.0
    gap_count: int = 0
    hazard_linked: int = 0
    feature_count: int = 0
    module_count: int = 0
    modules: dict = Field(default_factory=dict)
    features: dict = Field(default_factory=dict)


class RTMModuleCoverage(BaseModel):
    module_name: str = ""
    total_reqs: int = 0
    manual_covered: int = 0
    cats_covered: int = 0
    fully_covered: int = 0
    gap_count: int = 0
    coverage_pct: float = 0.0
    manual_pct: float = 0.0
    cats_pct: float = 0.0
