"""Software Trace Hub — RTM / STA / FMEA / Resources / IEC 62304 / ISO 14971"""
import os
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import domain cores to trigger schema registration (order matters: RTM before STA)
import core.rtm_core       # noqa: F401 — registers RTM schema
import core.sta_core        # noqa: F401 — registers STA schema (FK refs to RTM)
import core.fmea_core       # noqa: F401 — registers FMEA schema
import core.resource_core   # noqa: F401 — registers Resource schema
import core.swdd_core       # noqa: F401 — registers SWDD schema

from routes.rtm_routes import router as rtm_router
from routes.sta_routes import router as sta_router
from routes.fmea_routes import router as fmea_router
from routes.resource_routes import router as resource_router
from routes.swdd_routes import router as swdd_router

app = FastAPI(title="Software Trace Hub", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:5001", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rtm_router)
app.include_router(sta_router)
app.include_router(fmea_router)
app.include_router(resource_router)
app.include_router(swdd_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend dist if it exists (production)
_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa_catch_all(full_path: str):
        return FileResponse(os.path.join(_DIST, "index.html"))


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
