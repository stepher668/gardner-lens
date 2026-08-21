from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import artwork, collection, identify
from app.core.config import get_settings
from app.core.db import Base, SessionLocal, engine
from app.matching.index import reference_index

settings = get_settings()


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
