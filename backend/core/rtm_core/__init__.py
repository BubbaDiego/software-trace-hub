"""RTM Core — Requirements Traceability Matrix management.

Usage:
    from backend.core.rtm_core import RTMCore

    rtm = RTMCore()
    result = rtm.import_excel("path/to/rtm.xlsx")
    overview = rtm.get_overview(result["project_id"])
"""

from .rtm_core import RTMCore
from .models import (
    RTMProject,
    RTMRequirement,
    RTMTestEvidence,
    RTMGap,
    RTMHazard,
    RTMSnapshot,
    RTMOverview,
    RTMModuleCoverage,
    GapType,
    GapPriority,
    EvidenceType,
    TraceStatus,
)

__all__ = [
    "RTMCore",
    "RTMProject",
    "RTMRequirement",
    "RTMTestEvidence",
    "RTMGap",
    "RTMHazard",
    "RTMSnapshot",
    "RTMOverview",
    "RTMModuleCoverage",
    "GapType",
    "GapPriority",
    "EvidenceType",
    "TraceStatus",
]
