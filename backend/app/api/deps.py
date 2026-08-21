"""Shared request-scoped helpers: DB session, visit resolution, and
add-to-collection - all reused by both the /identify and /identify/confirm
routes."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.db import get_db  # noqa: F401  (re-exported for route imports)
from app.models import Artwork, Visit, VisitArtwork
from app.models.models import utc_now


def get_or_create_visit(db: Session, session_id: str | None) -> Visit:
    """No login (PRD Phase 3) - a session_id round-tripped from the client
    (local storage) identifies the Visit. Missing, unknown, or expired ->
    a fresh Visit, transparently, per the 24h TTL (Tech Arch Section 6 /
    Section 10 Decision #3)."""
    visit: Visit | None = None
    if session_id:
        visit = db.get(Visit, session_id)
        if visit is not None and visit.is_expired():
            visit = None

    if visit is None:
        visit = Visit()
        db.add(visit)
        db.flush()

    return visit


def add_to_collection(db: Session, visit: Visit, artwork_id: str) -> None:
    """Automatic on successful match, not a separate visitor action (OOUX
    doc, Artwork CTAs). Idempotent per artwork so re-photographing the same
    piece doesn't duplicate its Collection grid entry."""
    already_present = any(item.artwork_id == artwork_id for item in visit.items)
    if already_present:
        return

    next_order = len(visit.items)
    db.add(
        VisitArtwork(
            visit_id=visit.id,
            artwork_id=artwork_id,
            scan_order=next_order,
            photographed_at=utc_now(),
        )
    )
    db.flush()
    db.refresh(visit)


def get_artwork_or_404(db: Session, artwork_id: str) -> Artwork:
    from fastapi import HTTPException

    artwork = db.get(Artwork, artwork_id)
    if artwork is None:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return artwork
