# Software Trace Hub — Claude Handoff Instructions

## What This Is

Standalone regulatory traceability app for medical device 510(k) submissions, extracted from a larger project (Sonic10). It tracks RTM (Requirements Traceability Matrix), STA (Software Traceability Analysis), IEC 62304 compliance, and ISO 14971 risk management.

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
python app.py                 # FastAPI on port 5000

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
- **Database**: `backend/data/rtm.db` (auto-created, gitignored)
- **No auth, no Redux, no theme system** — intentionally minimal

### Key Files

| File | Purpose |
|------|---------|
| `backend/app.py` | FastAPI entry point (~40 lines) |
| `backend/core/rtm_core/rtm_core.py` | RTMCore facade — all operations go through here |
| `backend/core/rtm_core/rtm_db.py` | SQLite singleton, 9 tables, auto-migration |
| `backend/core/rtm_core/importer.py` | RTM Excel → SQLite parser |
| `backend/core/rtm_core/sta_importer.py` | STA Excel enrichment parser |
| `backend/core/rtm_core/analyzer.py` | Gap analysis + coverage computation |
| `backend/routes/rtm_routes.py` | 21 API routes under /api/rtm/* |
| `frontend/src/App.jsx` | Router: /rtm, /iec62304, /iso14971 |
| `frontend/src/layout/AppLayout.jsx` | Sidebar layout with 3 nav items |
| `frontend/src/api/rtm.js` | 12 SWR hooks + 7 mutations |
| `frontend/src/views/rtm/RTMPage.jsx` | Main RTM page (6 tabs, import UI) |

### Patterns

- **Facade**: `RTMCore()` is the single entry point for all backend operations
- **Singleton DB**: `RTMDatabase.get_instance()` — thread-safe, schema self-heals
- **SWR hooks**: All reads go through SWR for caching; mutations call `mutate()` to refresh
- **Bundled data**: Two .xlsx files ship in `backend/core/rtm_core/` for demo/testing
- **Import path**: Backend uses `PYTHONPATH=backend` so imports are `from core.rtm_core import RTMCore`
- **Vite proxy**: `/api/*` proxied to `:5000` in dev; in production, backend serves `frontend/dist/` as SPA

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

### Static Mock Data (needs backend):
- **IEC 62304 page** — all 4 tabs render hardcoded Alaris v12.6 data
- **ISO 14971 page** — all 4 tabs render hardcoded risk data

The API hooks already exist in `frontend/src/api/iec62304.js` and `frontend/src/api/iso14971.js` pointing to endpoints like `/api/rtm/iec62304/overview/{id}`. These backend routes don't exist yet. The components have static `const` arrays that should be replaced with the SWR hook calls once the backend routes are built.

### Planned endpoint patterns:
```
/api/rtm/iec62304/overview/{project_id}
/api/rtm/iec62304/clauses/{project_id}
/api/rtm/iec62304/gaps/{project_id}
/api/rtm/iec62304/safety/{project_id}

/api/rtm/iso14971/overview/{project_id}
/api/rtm/iso14971/matrix/{project_id}
/api/rtm/iso14971/clauses/{project_id}
/api/rtm/iso14971/controls/{project_id}
/api/rtm/iso14971/hazards/{project_id}
```

---

## Sample Data

The bundled Alaris v12.6 infusion pump data includes:
- **RTM**: 6,740 requirements across 7 modules (PCU, LVP, SYR, PCA, EtCO2, SPO2, Auto-ID), 57 features
- **STA**: 5,918 SRS spec refs, 6,735 design outputs, 7 version histories (v12.1.x → v12.6)
- Safety Class C medical device (death/serious injury possible)

To load: click "Load Bundled RTM" on the RTM page, then "Enrich with STA" in the header bar.

---

## Important Notes

- The `rtm.db` file is gitignored and auto-created on first run. Delete it to start fresh.
- All SQL uses parameterized queries (`?` placeholders) — never f-strings
- The STA enrichment links to RTM requirements via SRD ID matching (one SRD → many requirements)
- STA re-import is idempotent — deletes old STA data for the project before re-importing
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
