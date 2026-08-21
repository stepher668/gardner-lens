"""
One-time seed script (Tech Arch Section 10, Decision #4: "a simple one-time
seed script - photos + metadata in, ORB descriptors precomputed, DB
populated - no admin UI for the pilot").

Run from the `backend/` directory:

    python -m app.seed.seed_pilot

Reads real photos from `data/pilot/professional/<slug>/*.{jpg,jpeg,png}` at
the repo root if present. If a piece has none there yet, generates a clearly
labeled placeholder image instead and logs a warning - never lets a
placeholder pass silently as real content.

DESTRUCTIVE: wipes and rebuilds all pilot tables (including Visits) each
run, since this is a one-time pilot-setup script, not a live migration
tool.
"""
from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import Base, SessionLocal, engine
from app.matching.orb_pipeline import compute_descriptors, serialize
from app.models import (
    Artwork,
    ArtworkCreator,
    ArtworkImage,
    ArtworkStatus,
    Category,
    Creator,
    CreatorType,
    Floor,
    ReferencePhoto,
    Room,
    Visit,
    VisitArtwork,
)
from app.seed.placeholder_images import generate_placeholder_image

import json

METADATA_PATH = Path(__file__).resolve().parent / "data" / "pilot_metadata.json"
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")


def _repo_pilot_dir(configured: str) -> Path:
    configured_path = Path(configured)
    if configured_path.is_absolute():
        return configured_path
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "data" / "pilot"


def _load_metadata() -> dict:
    return json.loads(METADATA_PATH.read_text())


def _wipe(db: Session) -> None:
    # Dependent-first, matching the FK order in the models.
    for model in (VisitArtwork, Visit, ReferencePhoto, ArtworkImage, ArtworkCreator, Artwork, Room, Floor, Creator, Category):
        db.query(model).delete()
    db.commit()


def _find_real_photos(pilot_dir: Path, subset: str, slug: str) -> list[Path]:
    folder = pilot_dir / subset / slug
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS)


def _ensure_professional_photos(pilot_dir: Path, slug: str, title: str) -> list[Path]:
    """Returns paths to this piece's professional reference photos, real if
    present, else a generated + saved placeholder (so re-runs are stable
    and a human can see what got generated on disk)."""
    real = _find_real_photos(pilot_dir, "professional", slug)
    if real:
        return real

    print(f"  [!] No real professional photo for '{title}' ({slug}) - generating a placeholder.")
    folder = pilot_dir / "professional" / slug
    folder.mkdir(parents=True, exist_ok=True)
    out_path = folder / "placeholder_01.jpg"
    out_path.write_bytes(generate_placeholder_image(title, slug, variant=0))
    return [out_path]


def seed() -> None:
    settings = get_settings()
    pilot_dir = _repo_pilot_dir(settings.pilot_data_dir)
    metadata = _load_metadata()

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Wiping existing pilot data...")
        _wipe(db)

        print("Seeding floors and rooms...")
        floor_by_name: dict[str, Floor] = {}
        room_by_name: dict[str, Room] = {}
        for room_name, floor_name in metadata["rooms"].items():
            floor = floor_by_name.get(floor_name)
            if floor is None:
                floor = Floor(name=floor_name)
                db.add(floor)
                floor_by_name[floor_name] = floor
            room = Room(name=room_name, floor=floor)
            db.add(room)
            room_by_name[room_name] = room
        db.flush()

        print("Seeding creators...")
        creator_by_name: dict[str, Creator] = {}
        for name, info in metadata["creators"].items():
            creator = Creator(
                name=name,
                creator_type=CreatorType(info["creator_type"]),
                nationality_culture=info.get("nationality_culture"),
                date_start=info.get("date_start"),
                date_end=info.get("date_end"),
            )
            db.add(creator)
            creator_by_name[name] = creator
        db.flush()

        print("Seeding categories...")
        category_by_name: dict[str, Category] = {}
        for artwork_data in metadata["artworks"]:
            cat_name = artwork_data["category"]
            if cat_name not in category_by_name:
                category = Category(name=cat_name)
                db.add(category)
                category_by_name[cat_name] = category
        db.flush()

        print("Seeding artworks + reference photos...")
        for artwork_data in metadata["artworks"]:
            slug = artwork_data["slug"]
            title = artwork_data["title"]

            artwork = Artwork(
                title=title,
                date_display=artwork_data["date_display"],
                date_start_year=artwork_data["date_start_year"],
                date_end_year=artwork_data["date_end_year"],
                description=artwork_data["description"],
                status=ArtworkStatus(artwork_data["status"]),
                medium=artwork_data["medium"],
                accession_number=artwork_data["accession_number"],
                category=category_by_name[artwork_data["category"]],
                room=room_by_name[artwork_data["room"]],
            )
            db.add(artwork)
            db.flush()

            for link in artwork_data["creators"]:
                db.add(
                    ArtworkCreator(
                        artwork_id=artwork.id,
                        creator_id=creator_by_name[link["name"]].id,
                        role=link["role"],
                        sort_order=link["sort_order"],
                    )
                )

            photo_paths = _ensure_professional_photos(pilot_dir, slug, title)

            # First professional photo doubles as the clean display image
            # (design brief 3.3: "the clean museum reference image, not
            # the visitor's own shot"). alt_text left unset so the API
            # serializer's title/creator fallback (Tech Arch Section 9) is
            # exercised rather than duplicated here.
            db.add(ArtworkImage(artwork_id=artwork.id, url=str(photo_paths[0]), alt_text=None))

            for photo_path in photo_paths:
                image_bytes = photo_path.read_bytes()
                descriptor_set = compute_descriptors(image_bytes)
                db.add(
                    ReferencePhoto(
                        artwork_id=artwork.id,
                        image_url=str(photo_path),
                        orb_descriptors=serialize(descriptor_set),
                    )
                )

            print(f"  seeded '{title}' with {len(photo_paths)} reference photo(s)")

        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(seed() or 0)
