"""
Test env vars MUST be set before `app.*` is imported anywhere (app.core.db
builds its engine at import time from app.core.config.get_settings(),
which is lru_cached) - hence these two lines run before any app import,
even though that reads oddly for a conftest.
"""
import os
import tempfile
from pathlib import Path

_TEST_DIR = Path(tempfile.mkdtemp(prefix="gardner_lens_test_"))
os.environ["GARDNER_LENS_DATABASE_URL"] = f"sqlite:///{_TEST_DIR / 'test.db'}"
os.environ["GARDNER_LENS_PILOT_DATA_DIR"] = str(_TEST_DIR / "pilot")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app, rebuild_reference_index  # noqa: E402
from app.models import Artwork  # noqa: E402
from app.seed.seed_pilot import seed as seed_pilot_db  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _seeded_database():
    """Runs the real seed script (placeholders, since no real photos exist
    in the temp pilot dir) once per test session, against a throwaway
    SQLite DB, then builds the in-memory reference index from it - the
    same startup sequence app.main.on_startup runs in production."""
    Base.metadata.create_all(bind=engine)
    seed_pilot_db()
    rebuild_reference_index()
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def db() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def artwork_id_by_title(db: Session, title: str) -> str:
    artwork = db.query(Artwork).filter(Artwork.title == title).one()
    return artwork.id
