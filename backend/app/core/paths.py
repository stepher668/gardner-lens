"""Shared path resolution - used by both the seed script (reads photo
bytes off disk) and main.py (serves the same directory over HTTP), so
there's exactly one definition of "where is the pilot data" to keep in
sync."""
from __future__ import annotations

from pathlib import Path

from app.core.config import Settings


def resolve_pilot_dir(settings: Settings) -> Path:
    configured = Path(settings.pilot_data_dir)
    if configured.is_absolute():
        return configured
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "data" / "pilot"
