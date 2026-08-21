"""GET /collection/:session_id (Tech Arch Section 7) - backs the Collection
home/base screen (design brief Section 3.5). An unknown or expired session
returns an empty collection rather than a 404, so the frontend's empty
state (design brief: "Take your first photo to start your collection")
renders correctly instead of erroring."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Visit
from app.schemas.schemas import CollectionItemOut, CollectionOut

router = APIRouter(tags=["collection"])


@router.get("/collection/{session_id}", response_model=CollectionOut)
def get_collection(session_id: str, db: Session = Depends(get_db)) -> CollectionOut:
    visit = db.get(Visit, session_id)
    if visit is None or visit.is_expired():
        return CollectionOut(session_id=session_id, items=[], count=0)

    items = [
        CollectionItemOut(
            artwork_id=vi.artwork_id,
            title=vi.artwork.title,
            image=(
                None
                if not vi.artwork.images
                else {
                    "url": vi.artwork.images[0].url,
                    "alt_text": vi.artwork.images[0].alt_text or vi.artwork.title,
                }
            ),
            photographed_at=vi.photographed_at,
        )
        for vi in visit.items
    ]
    return CollectionOut(session_id=visit.id, items=items, count=len(items))
