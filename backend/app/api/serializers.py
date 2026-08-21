"""Model -> API schema conversion, kept in one place so ArtworkDetailOut and
CandidateOut can never drift into two different multi-creator/alt-text
rules."""
from __future__ import annotations

from app.models import Artwork
from app.schemas.formatting import CreatorCredit, format_creator_display
from app.schemas.schemas import ArtworkDetailOut, ArtworkImageOut, CandidateOut, CreatorOut


def _credits(artwork: Artwork) -> list[CreatorCredit]:
    links = sorted(artwork.creator_links, key=lambda link: link.sort_order)
    return [CreatorCredit(name=link.creator.name, role=link.role) for link in links]


def _display_image(artwork: Artwork) -> ArtworkImageOut | None:
    if not artwork.images:
        return None
    image = artwork.images[0]
    alt = image.alt_text or f"{artwork.title}, {format_creator_display(_credits(artwork))}"
    return ArtworkImageOut(url=image.url, alt_text=alt)


def to_artwork_detail(artwork: Artwork) -> ArtworkDetailOut:
    links = sorted(artwork.creator_links, key=lambda link: link.sort_order)
    creators = [
        CreatorOut(
            name=link.creator.name,
            role=link.role,
            creator_type=link.creator.creator_type.value,
            nationality_culture=link.creator.nationality_culture,
            date_start=link.creator.date_start,
            date_end=link.creator.date_end,
            place_start=link.creator.place_start,
            place_end=link.creator.place_end,
        )
        for link in links
    ]
    return ArtworkDetailOut(
        id=artwork.id,
        title=artwork.title,
        date_display=artwork.date_display,
        description=artwork.description,
        medium=artwork.medium,
        status=artwork.status.value,
        creators=creators,
        creator_display=format_creator_display(_credits(artwork)),
        image=_display_image(artwork),
        room_name=artwork.room.name,
        floor_name=artwork.room.floor.name,
        category_name=artwork.category.name,
    )


def to_candidate(artwork: Artwork) -> CandidateOut:
    return CandidateOut(
        id=artwork.id,
        title=artwork.title,
        creator_display=format_creator_display(_credits(artwork)),
        image=_display_image(artwork),
    )
