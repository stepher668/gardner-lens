from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import artwork, collection, identify
from app.core.config import get_settings
from app.core.db import Base, SessionLocal, engine
from app.core.paths import resolve_pilot_dir
from app.matching.index import reference_index

settings = get_settings()
pilot_dir = resolve_pilot_dir(settings)
pilot_dir.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Pilot-scale convenience: ensures tables exist even if Alembic
    # migrations haven't been run yet. Alembic (backend/alembic/) is the
    # source of truth for schema changes going forward.
    Base.metadata.create_all(bind=engine)
    rebuild_reference_index()
    yield


app = FastAPI(title="Gardner Lens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(identify.router)
app.include_router(artwork.router)
app.include_router(collection.router)

# Serves data/pilot/{display,reference,visitor}/... - the seed script
# stores ArtworkImage.url / ReferencePhoto.image_url as paths under this
# prefix (app/seed/seed_pilot.py's MEDIA_URL_PREFIX), so a real HTTP URL
# reaches the frontend instead of a raw server filesystem path.
app.mount("/media/pilot", StaticFiles(directory=pilot_dir), name="pilot-media")


def rebuild_reference_index() -> None:
    """Loads every ReferencePhoto's precomputed descriptors into the
    in-memory index (app.matching.index). Call again after re-seeding."""
    db = SessionLocal()
    try:
        reference_index.load(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "reference_artworks_indexed": reference_index.artwork_count}


# Single-container deploy: the built frontend (frontend/dist, copied into
# the image by backend/Dockerfile) is served from this same origin - no
# separate frontend host, no CORS to configure for it. Mounted at "/" and
# registered LAST, after every real route/mount above (Starlette matches
# routes/mounts in registration order, and Mount("/") matches literally
# every path - registering it any earlier would silently shadow /health,
# /identify, etc. behind a 404 from StaticFiles instead of reaching them).
# Absent in local dev (frontend runs via `npm run dev` instead), so this
# only activates when the directory actually exists.
if settings.frontend_dist_dir:
    frontend_dist = Path(settings.frontend_dist_dir)
    if frontend_dist.is_dir():
        app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
