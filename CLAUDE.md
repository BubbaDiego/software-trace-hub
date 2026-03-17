# Software Trace Hub — Claude Handoff Instructions

## What This Is

Standalone regulatory traceability app for medical device 510(k) submissions, extracted from a larger project (Sonic10). It tracks RTM (Requirements Traceability Matrix), STA (Software Traceability Analysis), FMEA (Failure Mode and Effects Analysis), Resource Planning, IEC 62304 compliance, and ISO 14971 risk management.

**Repo**: https://github.com/BubbaDiego/software-trace-hub
**Origin**: Extracted from https://github.com/BubbaDiego/sonic10 (the RTM/STA/IEC/ISO pieces only)

---

## Commands

```bash
# Run everything
python launch.py              # Menu launcher — pick [3] for both servers

# Backend
cd backend
set PYTHONPATH=.              # Windows (use export on Linux/Mac)
python app.py                 # FastAPI on port 5001

# Frontend
cd frontend
npm install                   # First time only
npm run dev                   # Vite dev server on port 3001
npm run build                 # Production build → frontend/dist/
```

---

## Architecture

- **Backend**: Python 3.11+ / FastAPI / SQLite WAL / openpyxl
- **Frontend**: React 18 / Vite 7 / MUI 7 / SWR / Tabler Icons
- **Database**: `backend/data/rtm.db` (auto-created, gitignored) — single shared DB, all domains
- **No auth, no Redux, no theme system** — intentionally minimal

### Domain Core Architecture

Each domain has its own core module with a facade class, importer, and schema registration:

```
backend/core/
├── shared/
│   └── database.py              # SharedDatabase singleton — all domains share one SQLite file
├── rtm_core/
│   ├── rtm_core.py              # RTMCore facade — requirements, gaps, snapshots
│   ├── rtm_db.py                # Registers RTM schema + RTMDatabase alias
│   ├── importer.py              # RTM Excel parser
│   ├── analyzer.py              # Gap analysis + coverage computation
│   └── models.py                # Pydantic models
├── sta_core/
│   ├── sta_core.py              # STACore facade — spec refs, design outputs, versions
│   └── sta_importer.py          # STA Excel enrichment parser
├── fmea_core/
│   ├── fmea_core.py             # FMEACore facade — failure modes, severity, risk
│   └── fmea_importer.py         # FMEA Excel parser
└── resource_core/
    ├── resource_core.py         # ResourceCore facade — people, allocations
    └── resource_importer.py     # Resource Excel parser
```

### Routes (split by domain)

```
backend/routes/
├── rtm_routes.py                # /api/rtm/* — 17 endpoints
├── sta_routes.py                # /api/sta/* — 4 endpoints
├── fmea_routes.py               # /api/fmea/* — 6 endpoints
└── resource_routes.py           # /api/resources/* — 2 endpoints
```

### Frontend API Layer (split by domain)

```
frontend/src/api/
├── rtm.js                       # RTM hooks + mutations
├── sta.js                       # STA hooks + mutations
├── fmea.js                      # FMEA hooks + mutations
└── resources.js                 # Resource hooks + mutations
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/app.py` | FastAPI entry point — imports all domain cores, registers 4 routers |
| `backend/core/shared/database.py` | SharedDatabase singleton with schema registration |
| `backend/core/rtm_core/rtm_core.py` | RTMCore facade — requirements, gaps, snapshots |
| `backend/core/sta_core/sta_core.py` | STACore facade — STA enrichment queries |
| `backend/core/fmea_core/fmea_core.py` | FMEACore facade — FMEA records, overview, product matrix |
| `backend/core/resource_core/resource_core.py` | ResourceCore facade — people, allocations |
| `frontend/src/App.jsx` | Router: /rtm, /iec62304, /iso14971, /resources, /data-sources |
| `frontend/src/layout/AppLayout.jsx` | Sidebar layout with 5 nav items |
| `frontend/src/views/rtm/RTMPage.jsx` | Main RTM page (6 tabs, import UI) |
| `frontend/src/views/datasources/DataSourcesPage.jsx` | Centralized upload hub for all 4 data sources |

### Patterns

- **Domain Cores**: Each domain (RTM, STA, FMEA, Resources) has its own facade class, importer, and schema
- **Shared DB**: `SharedDatabase.get_instance()` — thread-safe singleton, all domains share one SQLite file
- **Schema Registration**: Each domain's `__init__.py` calls `SharedDatabase.register_schema(ddl)` at import time
- **Cross-domain reads**: STA tables have FKs to RTM tables; `RTMCore.get_requirement_detail()` reads STA data directly via shared DB
- **SWR hooks**: All reads go through SWR for caching; mutations call `mutate()` to refresh
- **Bundled data**: Two .xlsx files ship in `backend/core/rtm_core/` for demo/testing
- **Import path**: Backend uses `PYTHONPATH=backend` so imports are `from core.rtm_core import RTMCore`
- **Vite proxy**: `/api/*` proxied to `:5001` in dev; in production, backend serves `frontend/dist/` as SPA

---

## Current State

### Working (RTM — fully functional):
- RTM Excel import (bundled + file upload)
- STA Excel enrichment (bundled + file upload)
- Executive Overview with KPIs, coverage donut, module bars, risk heatmap
- Feature Traceability with heatmap + filterable table
- Module Coverage breakdown
- Gap Analysis with priority, assignment, resolution
- Test Evidence Explorer with full detail drill-down
- Software Traceability (STA) with version verification matrix
- Import/export (JSON + CSV)

### Working (FMEA — fully functional):
- FMEA Excel import (file upload)
- FMEA overview with product breakdown, RCM types, hazard categories
- FMEA records browser with product filter and search
- Common causes viewer
- Cross-product hazard matrix

### Working (Resources — import only):
- Resource Excel import (file upload)
- Import summary (people count, allocation rows)

### Working (Data Sources):
- Centralized upload hub for all 4 data sources (RTM, STA, FMEA, Resources)

### Static Mock Data (needs backend):
- **IEC 62304 page** — all 4 tabs render hardcoded Alaris v12.6 data
- **ISO 14971 page** — all 4 tabs render hardcoded risk data
- **Resource Planner page** — 4 tabs render hardcoded FY26 data

### Planned endpoint patterns:
```
/api/iec62304/overview/{project_id}
/api/iec62304/clauses/{project_id}
/api/iec62304/gaps/{project_id}
/api/iec62304/safety/{project_id}

/api/iso14971/overview/{project_id}
/api/iso14971/matrix/{project_id}
/api/iso14971/clauses/{project_id}
/api/iso14971/controls/{project_id}
/api/iso14971/hazards/{project_id}
```

---

## Sample Data

The bundled Alaris v12.6 infusion pump data includes:
- **RTM**: 6,740 requirements across 7 modules (PCU, LVP, SYR, PCA, EtCO2, SPO2, Auto-ID), 57 features
- **STA**: 5,918 SRS spec refs, 6,735 design outputs, 7 version histories (v12.1.x → v12.6)
- Safety Class C medical device (death/serious injury possible)

To load: click "Load Bundled RTM" on the Data Sources page, then "Load Bundled STA".

---

## Important Notes

- The `rtm.db` file is gitignored and auto-created on first run. Delete it to start fresh.
- All SQL uses parameterized queries (`?` placeholders) — never f-strings
- Schema registration order matters: RTM must be imported before STA (FK dependencies). `app.py` controls this.
- The STA enrichment links to RTM requirements via SRD ID matching (one SRD → many requirements)
- STA re-import is idempotent — deletes old STA data for the project before re-importing
- FMEA import is idempotent — clears all existing FMEA data before re-importing
- The RTM import detects duplicates via file SHA-256 hash
- MUI v7 uses the `size` prop on Grid (not `xs`/`md` directly): `<Grid size={{ xs: 12, md: 6 }}>`
- Tabler icons Vite alias is critical for tree-shaking: `'@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'`

---

## Deployment

Not yet deployed standalone. For production:
1. `cd frontend && npm run build` → creates `frontend/dist/`
2. `backend/app.py` auto-serves `frontend/dist/` as SPA when the directory exists
3. Only need to deploy the backend (it serves both API + static frontend)
4. Set `PYTHONPATH` to include the `backend/` directory
5. Needs: Python 3.11+, ~8 pip packages, no Node.js at runtime
