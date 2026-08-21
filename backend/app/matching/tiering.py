"""
Three-tier confidence model (Tech Arch Section 2 / design brief Section 3.4).

    Tier               Threshold        Behavior
    1 Confident Match  >= 8 inliers     Auto-display the result
    2 "Did You Mean?"  6-7 inliers      Up to 4 tappable candidates, ranked
    3 No Match         < 6 inliers      Plain retry, no candidate list

Both thresholds are configurable (app.core.config.Settings) rather than
hardcoded here, since the source doc flags the Tier 2 floor specifically as
a tunable starting point, less rigorously validated than Tier 1.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.core.config import Settings
from app.matching.index import RankedArtwork

Tier = Literal["confident", "did_you_mean", "no_match"]


@dataclass
class TieringResult:
    tier: Tier
    # Tier 1: exactly one id. Tier 2: up to tier2_max_candidates ids,
    # ranked highest-first. Tier 3: empty.
    artwork_ids: list[str]


def classify(ranked: list[RankedArtwork], settings: Settings) -> TieringResult:
    if not ranked or ranked[0].score < settings.tier2_min_inliers:
        return TieringResult(tier="no_match", artwork_ids=[])

    top = ranked[0]
    if top.score >= settings.tier1_min_inliers:
        return TieringResult(tier="confident", artwork_ids=[top.artwork_id])

    # Tier 2: every artwork whose individual score clears the floor, capped
    # - never padded with sub-floor guesses just to fill slots (design
    # brief Section 3.4 / Tech Arch Section 2).
    candidates = [r for r in ranked if r.score >= settings.tier2_min_inliers]
    candidates = candidates[: settings.tier2_max_candidates]
    return TieringResult(tier="did_you_mean", artwork_ids=[c.artwork_id for c in candidates])
