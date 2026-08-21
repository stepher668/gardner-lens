"""
SQLAlchemy models.

Maps directly to `gardner-lens-ooux-model.md` (Objects/Relationships/
Attributes) and Technical Architecture Section 3 ("Data Model"). Field-level
comments below cite the source doc so this stays traceable back to the
finalized decisions rather than drifting.

IDs are stored as 36-char strings (str(uuid4())), not a Postgres-native UUID
type, so the same models work against Postgres (production, per Tech Arch
Decision #2) and SQLite (fast local tests) without a dialect split.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Naive UTC, deliberately - SQLite's DateTime storage doesn't
    round-trip tzinfo, so mixing aware and naive values across a
    Postgres/SQLite split (production vs. tests) breaks comparisons. Every
    datetime in this module is UTC and naive, consistently."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ArtworkStatus(str, enum.Enum):
    ON_VIEW = "on_view"
    OFF_VIEW = "off_view"


class CreatorType(str, enum.Enum):
    """Controls display phrasing (OOUX doc, Creator.Creator Type) - e.g.
    "b. 1599, Seville - d. 1660" for a person vs. "active New York,
    1878-1891" for an organization/culture attribution. Presentation-layer
    flag, not a second date schema."""

    PERSON = "person"
    ORGANIZATION = "organization"
    CULTURE_OR_UNKNOWN = "culture_or_unknown"


class Floor(Base):
    __tablename__ = "floors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    rooms: Mapped[list["Room"]] = relationship(back_populates="floor")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    # The Courtyard is its own Room on Floor 1 despite spanning multiple
    # floors physically (OOUX doc, Object 4 note) - modeled with no
    # exception, same as every other Room.
    floor_id: Mapped[str] = mapped_column(ForeignKey("floors.id"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    floor: Mapped[Floor] = relationship(back_populates="rooms")
    artworks: Mapped[list["Artwork"]] = relationship(back_populates="room")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    artworks: Mapped[list["Artwork"]] = relationship(back_populates="category")


class Creator(Base):
    __tablename__ = "creators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    creator_type: Mapped[CreatorType] = mapped_column(
        Enum(CreatorType, native_enum=False), nullable=False, default=CreatorType.PERSON
    )
    nationality_culture: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Generic shape - covers both life-dates and active-periods (OOUX doc)
    date_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Generic shape - covers birthplace/deathplace or active-location
    place_start: Mapped[str | None] = mapped_column(String(255), nullable=True)
    place_end: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    artwork_links: Mapped[list["ArtworkCreator"]] = relationship(back_populates="creator")


class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    # e.g. "about 1580-1589" - matches the real site's flexible date text
    date_display: Mapped[str] = mapped_column(String(255), nullable=False)
    # Normalized start/end year. A range spanning two centuries belongs to
    # BOTH; derived century values must come from these, never be
    # hand-maintained (OOUX doc, Artwork.Date normalized).
    date_start_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_end_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Gates whether Gardner Lens should ever try to match it (OOUX doc)
    status: Mapped[ArtworkStatus] = mapped_column(
        Enum(ArtworkStatus, native_enum=False), nullable=False, default=ArtworkStatus.ON_VIEW
    )
    medium: Mapped[str | None] = mapped_column(String(500), nullable=True)
    accession_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False)
    # Every Artwork always has a Room, even Off View (its *normal* room) -
    # storage/off-site location is out of scope (OOUX doc relationship note).
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)

    category: Mapped[Category] = relationship(back_populates="artworks")
    room: Mapped[Room] = relationship(back_populates="artworks")
    images: Mapped[list["ArtworkImage"]] = relationship(
        back_populates="artwork", cascade="all, delete-orphan"
    )
    reference_photos: Mapped[list["ReferencePhoto"]] = relationship(
        back_populates="artwork", cascade="all, delete-orphan"
    )
    creator_links: Mapped[list["ArtworkCreator"]] = relationship(
        back_populates="artwork", cascade="all, delete-orphan"
    )


class ArtworkCreator(Base):
    """Join table - role lives here, not on Creator, since the same person
    can hold different roles on different pieces (OOUX doc, Relationships).
    Deliberately a single unified list (not split "made by" vs. "depicts")
    to match real site behavior."""

    __tablename__ = "artwork_creators"

    artwork_id: Mapped[str] = mapped_column(
        ForeignKey("artworks.id"), primary_key=True
    )
    creator_id: Mapped[str] = mapped_column(
        ForeignKey("creators.id"), primary_key=True
    )
    # author / artist / publisher / editor / subject / etc. - free text
    # per OOUX doc, not a closed enum (the real collection's role
    # vocabulary is open-ended).
    role: Mapped[str] = mapped_column(String(100), primary_key=True)
    # Display order when an artwork has multiple creators in the same role
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    artwork: Mapped[Artwork] = relationship(back_populates="creator_links")
    creator: Mapped[Creator] = relationship(back_populates="artwork_links")


class ArtworkImage(Base):
    """Clean display image (museum reference photo) - what the Result
    screen actually shows, per design brief Section 3.3 ("the clean museum
    reference image, not the visitor's own shot"). Distinct from
    ReferencePhoto below, which is matching data, not display data."""

    __tablename__ = "artwork_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    artwork_id: Mapped[str] = mapped_column(ForeignKey("artworks.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    # Accessibility (design brief Section 4 / Tech Arch Section 9): alt
    # text on every artwork image. Nullable so it can fall back to a
    # generated "{title}, by {creator}" string when not authored explicitly.
    alt_text: Mapped[str | None] = mapped_column(String(500), nullable=True)

    artwork: Mapped[Artwork] = relationship(back_populates="images")


class ReferencePhoto(Base):
    """Matching data, not display data (Tech Arch Section 3). Descriptors
    are precomputed once at ingest (seed script), never per-request (Tech
    Arch Section 2, step 6)."""

    __tablename__ = "reference_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    artwork_id: Mapped[str] = mapped_column(ForeignKey("artworks.id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    # Pickled (keypoints, descriptors) tuple - see app/matching/orb_pipeline.py
    # for the serialize/deserialize helpers. Internal-only, never touches
    # visitor-supplied data on the way in (only our own seed script writes
    # this column), so pickle's usual untrusted-input caveat doesn't apply.
    orb_descriptors: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    artwork: Mapped[Artwork] = relationship(back_populates="reference_photos")


class Visit(Base):
    """Session/collection container - no login, anonymous per visit (PRD
    Phase 3, Tech Arch Section 6). 24h TTL per Tech Arch Section 10
    Decision #3. Structurally required for Phase 1 even though "Email Me"
    itself isn't wired yet, because Collection-as-home + Result-as-drawer
    (design brief Section 2) depends on it."""

    __tablename__ = "visits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(), default=lambda: utc_now() + timedelta(hours=24)
    )

    items: Mapped[list["VisitArtwork"]] = relationship(
        back_populates="visit",
        cascade="all, delete-orphan",
        order_by="VisitArtwork.scan_order",
    )

    def is_expired(self, at: datetime | None = None) -> bool:
        return (at or utc_now()) >= self.expires_at


class VisitArtwork(Base):
    """One photographed piece within a Visit, in scan order. Scan order is
    load-bearing (Tech Arch Section 6): it feeds the Courtyard Plant
    algorithm's final tiebreak in Phase 4, so it's persisted now even
    though nothing reads it for that purpose yet."""

    __tablename__ = "visit_artworks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    visit_id: Mapped[str] = mapped_column(ForeignKey("visits.id"), nullable=False)
    artwork_id: Mapped[str] = mapped_column(ForeignKey("artworks.id"), nullable=False)
    scan_order: Mapped[int] = mapped_column(Integer, nullable=False)
    photographed_at: Mapped[datetime] = mapped_column(DateTime(), default=utc_now)

    visit: Mapped[Visit] = relationship(back_populates="items")
    artwork: Mapped[Artwork] = relationship()
