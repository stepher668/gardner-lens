"""Pydantic response/request models for the API surface (Tech Arch Section 7,
Phase 1 subset)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class CreatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    role: str
    creator_type: str
    nationality_culture: str | None = None
    date_start: int | None = None
    date_end: int | None = None


class ArtworkImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    alt_text: str


class ArtworkDetailOut(BaseModel):
    """Result screen content (design brief Section 3.3): photo, Title/
    Creator(s)/Year, description. Similar Works is deliberately NOT part of
    this response yet - Phase 2 is a UI-only tease this pass (see
    frontend), not a backend capability."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    date_display: str
    description: str
    medium: str | None = None
    status: str
    creators: list[CreatorOut]
    creator_display: str
    image: ArtworkImageOut | None
    room_name: str
    floor_name: str
    category_name: str


class CandidateOut(BaseModel):
    """One "Did You Mean?" candidate (design brief Section 3.4 / Tech Arch
    Section 2) - real reference image + a real text label, never a bare
    thumbnail, per the Section 4 accessibility note."""

    id: str
    title: str
    creator_display: str
    image: ArtworkImageOut | None


IdentifyTier = Literal["confident", "did_you_mean", "no_match"]


class IdentifyResult(BaseModel):
    """One of the three shapes from the three-tier confidence model (Tech
    Arch Section 2 / design brief Section 3.4)."""

    tier: IdentifyTier
    session_id: str
    artwork: ArtworkDetailOut | None = None
    candidates: list[CandidateOut] | None = None


class ConfirmRequest(BaseModel):
    """Visitor tapped a Tier 2 candidate. This confirms the match and adds
    it to the collection - the OOUX rule "Add to Your Collection: automatic
    on successful match, not a separate visitor action" still holds here;
    the visitor's tap *is* the resolution of the match, not a new action."""

    session_id: str | None = None
    artwork_id: str


class CollectionItemOut(BaseModel):
    artwork_id: str
    title: str
    image: ArtworkImageOut | None
    photographed_at: datetime


class CollectionOut(BaseModel):
    session_id: str
    items: list[CollectionItemOut]
    count: int
