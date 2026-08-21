"""POST /identify and POST /identify/confirm - Tech Arch Section 7.

/identify runs the matching pipeline (Tech Arch Section 2) and returns one
of the three tier shapes. /identify/confirm is the small necessary addition
for the Tier 2 flow: when a visitor taps a "Did You Mean?" candidate, that
tap *is* the successful match (OOUX doc: "Add to Your Collection: automatic
on successful match, not a separate visitor action") - this endpoint
records it and returns the same confident-match shape /identify would have.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import add_to_collection, get_artwork_or_404, get_db, get_or_create_visit
from app.api.serializers import to_artwork_detail, to_candidate
from app.core.config import Settings, get_settings
from app.matching.index import reference_index
from app.matching.orb_pipeline import compute_descriptors
from app.matching.tiering import classify
from app.models import Artwork
from app.schemas.schemas import ConfirmRequest, IdentifyResult

router = APIRouter(tags=["identify"])


@router.post("/identify", response_model=IdentifyResult)
async def identify(
    photo: UploadFile,
    session_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> IdentifyResult:
    image_bytes = await photo.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty photo upload")

    visit = get_or_create_visit(db, session_id)

    query = compute_descriptors(image_bytes)
    ranked = reference_index.rank(query)
    result = classify(ranked, settings)

    if result.tier == "confident":
        artwork = get_artwork_or_404(db, result.artwork_ids[0])
        add_to_collection(db, visit, artwork.id)
        db.commit()
        return IdentifyResult(tier="confident", session_id=visit.id, artwork=to_artwork_detail(artwork))

    if result.tier == "did_you_mean":
        db.commit()  # persist the (possibly newly-created) visit even without a match yet
        candidates = [to_candidate(get_artwork_or_404(db, aid)) for aid in result.artwork_ids]
        return IdentifyResult(tier="did_you_mean", session_id=visit.id, candidates=candidates)

    db.commit()
    return IdentifyResult(tier="no_match", session_id=visit.id)


@router.post("/identify/confirm", response_model=IdentifyResult)
def confirm(body: ConfirmRequest, db: Session = Depends(get_db)) -> IdentifyResult:
    visit = get_or_create_visit(db, body.session_id)
    artwork: Artwork = get_artwork_or_404(db, body.artwork_id)
    add_to_collection(db, visit, artwork.id)
    db.commit()
    return IdentifyResult(tier="confident", session_id=visit.id, artwork=to_artwork_detail(artwork))
