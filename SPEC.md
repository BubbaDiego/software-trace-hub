# Software Trace Hub — Technical Specification

## Overview

Standalone regulatory traceability application for medical device 510(k) FDA submissions. Extracted from Sonic10 (DeFi trading platform) as a fully independent product.

**Purpose**: Track requirements traceability (RTM), software traceability analysis (STA), IEC 62304 software lifecycle compliance, and ISO 14971 risk management — all from a single dashboard.

**Target Users**: Regulatory affairs engineers, software quality teams, and V&V engineers preparing medical device submissions.

---

## Architecture

```
software-trace-hub/
├── backend/                    # Python/FastAPI API server
│   ├── app.py                  # Entry point (FastAPI, CORS, SPA serving)
│   ├── requirements.txt        # 8 dependencies
│   ├── core/
│   │   └── rtm_core/           # Self-contained domain module
│   │       ├── __init__.py     # Lazy-loading facade exports
│   │       ├── rtm_core.py     # RTMCore facade class
│   │       ├── rtm_db.py       # SQLite singleton (rtm.db, WAL mode)
│   │       ├── models.py       # Pydantic models (RTMOverview, RTMModuleCoverage, RTMSnapshot)
│   │       ├── importer.py     # RTM Excel parser (.xlsx → SQLite)
│   │       ├── sta_importer.py # STA Excel parser (enrichment layer)
│   │       ├── analyzer.py     # Gap analysis + coverage computation
│   │       ├── Embedded RTM - Alaris v12.6 510k.xlsx    # Bundled sample (6,740 reqs)
│   │       └── Alaris System v12.6 Software Traceability Analysis.xlsx  # Bundled STA
│   ├── routes/
│   │   └── rtm_routes.py       # 21 FastAPI routes under /api/rtm/*
│   └── data/
│       └── rtm.db              # Auto-created SQLite database (gitignored)
├── frontend/                   # React/Vite/MUI frontend
│   ├── index.html
│   ├── package.json            # 11 deps + 2 devDeps
│   ├── vite.config.mjs         # Proxy /api → :5000, path aliases
│   ├── jsconfig.json
│   └── src/
│       ├── index.jsx           # React entry, MUI dark theme
│       ├── App.jsx             # Router: /rtm, /iec62304, /iso14971
│       ├── layout/
│       │   └── AppLayout.jsx   # Permanent sidebar + Outlet
│       ├── utils/
│       │   └── axios.js        # Axios instance + SWR fetcher
│       ├── api/
│       │   ├── rtm.js          # 12 SWR hooks + 7 mutation functions
│       │   ├── iec62304.js     # 4 SWR hooks (future backend)
│       │   └── iso14971.js     # 5 SWR hooks (future backend)
│       └── views/
│           ├── rtm/            # 7 components (RTMPage + 6 tabs)
│           ├── iec62304/       # 5 components (IEC62304Page + 4 tabs)
│           └── iso14971/       # 5 components (ISO14971Page + 4 tabs)
└── launch.py                   # Menu-driven launcher
```

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Python + FastAPI | 3.11+ / 0.115 |
| Database | SQLite (WAL mode) | stdlib |
| Excel Parser | openpyxl | 3.1.5 |
| Frontend | React + Vite | 18.3 / 7.x |
| UI Framework | MUI (Material UI) | 7.3.2 |
| Data Fetching | SWR + Axios | 2.3 / 1.9 |
| Icons | Tabler Icons React | 3.31 |
| Routing | React Router | 7.5 |

---

## Backend

### Database Schema (rtm.db — 9 tables)

**Core RTM tables:**
- `rtm_projects` — imported projects (name, version, file_hash, sta_enriched_at)
- `rtm_requirements` — individual requirements (srd_id, feature, sub_feature, module, spec_id, hazard_id, trace_status)
- `rtm_test_evidence` — test case mappings per requirement (module, evidence_type, tc_ids)
- `rtm_gap_analysis` — identified coverage gaps (gap_type, priority P1/P2/P3, assignee, notes)
- `rtm_snapshots` — point-in-time coverage snapshots

**STA enrichment tables:**
- `rtm_sta_spec_refs` — SRS specification references (ASWS, ASWUI, ASWIS)
- `rtm_sta_module_evidence` — per-module test case evidence
- `rtm_sta_design_outputs` — SDD section refs + unit test files
- `rtm_sta_version_verification` — version-by-version test refs + TER refs

### API Endpoints (21 routes)

**Projects:** GET /projects, DELETE /projects/{id}
**Import:** POST /import (file upload), POST /import-path, POST /import-bundled
**STA:** POST /sta-import/{id} (file), POST /sta-import-bundled/{id}, GET /sta-summary/{id}, GET /sta-versions/{id}
**Overview:** GET /overview/{id}, GET /modules/{id}, GET /heatmap/{id}, GET /features/{id}
**Requirements:** GET /requirements (paginated, filterable), GET /requirements/{id} (detail)
**Gaps:** GET /gaps/{id}, POST /gaps/{id}/refresh, PATCH /gaps/item/{id}
**Snapshots:** GET /snapshots/{id}, POST /snapshots/{id}
**Export:** GET /export/{id}?format=json|csv

### Key Patterns

- **RTMCore facade**: All operations go through `RTMCore()` — single import, single entry point
- **Singleton DB**: `RTMDatabase.get_instance()` — thread-safe, auto-creates schema
- **Idempotent import**: Duplicate files detected via SHA-256 hash; STA re-import deletes old data first
- **SRD ID matching**: STA enrichment links to RTM requirements via SRD ID (one SRD → many requirements)
- **Auto gap analysis**: Runs automatically after every RTM import

---

## Frontend

### Pages

**RTM Tracker** (`/rtm`) — 6 tabs:
1. Executive Overview — KPI cards, coverage donut, module distribution bars, module risk heatmap
2. Feature Traceability — feature × module coverage heatmap, filterable requirement table
3. Module Coverage — per-module bars with drill-down
4. Gap Analysis — filterable gap table with priority, assignee, resolution
5. Test Evidence Explorer — requirement detail with full evidence chain
6. Software Traceability — STA KPIs, version verification matrix (requires STA enrichment)

**IEC 62304** (`/iec62304`) — 4 tabs (static mock data):
1. Overview — compliance KPIs, process area bars, clause summary table
2. Clause Breakdown — expandable clause cards with sub-clauses
3. Safety Classes — Class A/B/C matrix showing required activities
4. Gaps & Actions — compliance gaps with owner assignment

**ISO 14971** (`/iso14971`) — 4 tabs (static mock data):
1. Risk Overview — hazard KPIs, category breakdown, risk waterfall
2. Risk Matrix — 5×5 pre/post mitigation severity × probability grids
3. Clause Compliance — expandable clause table with evidence status
4. Risk Controls — control measures table with verification status

### Data Flow

- **Reads**: Component → SWR hook (api/rtm.js) → axios → /api/rtm/* → RTMCore → SQLite
- **Mutations**: Component → axios.post → /api/rtm/* → RTMCore → SQLite → mutate() refreshes SWR cache
- **IEC/ISO pages**: Currently render hardcoded mock data. API hooks exist in api/iec62304.js and api/iso14971.js for future backend integration.

---

## Running

```bash
# Option 1: Launch pad
python launch.py    # Pick [3] for both

# Option 2: Manual
cd backend && set PYTHONPATH=. && python app.py        # Terminal 1
cd frontend && npm run dev                              # Terminal 2
```

Backend: http://localhost:5000
Frontend: http://localhost:3001

---

## What's NOT Here (compared to Sonic10)

- No authentication / login
- No Redux store
- No theme system (7 themes) — just MUI dark mode
- No DataLocker / mother.db
- No Solana / Jupiter / DeFi dependencies
- No monitor engine, playbook, wallet management
- No Twilio / ElevenLabs notifications
- 157 npm packages vs ~800+ in Sonic10
- 8 pip packages vs ~100+ in Sonic10
