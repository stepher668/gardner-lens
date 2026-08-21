"""
In-memory reference index.

At 7 pilot pieces, brute-force verification against every reference photo
is fast enough that no shortlist stage is needed (Tech Arch Section 2,
"Scale note" - a two-stage hybrid is flagged as a pre-launch task for
~2,500 pieces, explicitly NOT a pilot concern). This index is intentionally
that simple brute-force approach, built once at startup from the DB and
kept in memory - reference descriptors don't change without a re-seed.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.matching.orb_pipeline import DescriptorSet, deserialize, score_against_reference
from app.models import ReferencePhoto


@dataclass
class RankedArtwork:
    artwork_id: str
    score: int


class ReferenceIndex:
    def __init__(self) -> None:
        # artwork_id -> list of reference DescriptorSets
        self._by_artwork: dict[str, list[DescriptorSet]] = {}

    def load(self, db: Session) -> None:
        self._by_artwork.clear()
        photos = db.query(ReferencePhoto).filter(ReferencePhoto.orb_descriptors.isnot(None)).all()
        for photo in photos:
            descriptor_set = deserialize(photo.orb_descriptors)
            self._by_artwork.setdefault(photo.artwork_id, []).append(descriptor_set)

    @property
    def artwork_count(self) -> int:
        return len(self._by_artwork)

    def rank(self, query: DescriptorSet) -> list[RankedArtwork]:
        """Best score per artwork (Tech Arch Section 2, step 5: "Take the
        best score across all reference photos, across all artworks"),
        sorted highest first."""
        results: list[RankedArtwork] = []
        for artwork_id, reference_sets in self._by_artwork.items():
            best = max(
                (score_against_reference(query, ref) for ref in reference_sets),
                default=0,
            )
            results.append(RankedArtwork(artwork_id=artwork_id, score=best))
        results.sort(key=lambda r: r.score, reverse=True)
        return results


# Process-wide singleton, (re)built at app startup and after re-seeds.
reference_index = ReferenceIndex()
