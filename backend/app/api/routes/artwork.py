from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_artwork_or_404, get_db
from app.api.serializers import to_artwork_detail
from app.schemas.schemas import ArtworkDetailOut

router = APIRouter(tags=["artwork"])


@router.get("/artwork/{artwork_id}", response_model=ArtworkDetailOut)
def get_artwork(artwork_id: str, db: Session = Depends(get_db)) -> ArtworkDetailOut:
    artwork = get_artwork_or_404(db, artwork_id)
    return to_artwork_detail(artwork)
