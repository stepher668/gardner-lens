"""Unit tests for the ORB pipeline and the three-tier classifier -
independent of the API/DB layer."""
from __future__ import annotations

from app.core.config import Settings
from app.matching.index import RankedArtwork
from app.matching.orb_pipeline import compute_descriptors, score_against_reference
from app.matching.tiering import classify
from app.seed.placeholder_images import generate_placeholder_image


def test_identical_image_scores_high_enough_for_confident_tier():
    """The same photo compared against itself is the simplest possible
    "this is definitely the same piece" case - it must clear the Tier 1
    floor, or the pipeline wiring itself is broken."""
    image_bytes = generate_placeholder_image("El Jaleo", "el-jaleo")
    query = compute_descriptors(image_bytes)
    reference = compute_descriptors(image_bytes)

    score = score_against_reference(query, reference)

    settings = Settings()
    assert score >= settings.tier1_min_inliers


def test_unrelated_images_score_low():
    """Two images with different deterministic patterns (different slugs)
    should not produce a spatially-consistent RANSAC match."""
    image_a = generate_placeholder_image("El Jaleo", "el-jaleo")
    image_b = generate_placeholder_image("Europa", "europa")

    score = score_against_reference(compute_descriptors(image_a), compute_descriptors(image_b))

    settings = Settings()
    assert score < settings.tier2_min_inliers


def test_tiering_confident():
    ranked = [RankedArtwork("el-jaleo-id", 12), RankedArtwork("europa-id", 3)]
    result = classify(ranked, Settings())
    assert result.tier == "confident"
    assert result.artwork_ids == ["el-jaleo-id"]


def test_tiering_did_you_mean_ranks_and_caps_at_four():
    ranked = [
        RankedArtwork("a", 7),
        RankedArtwork("b", 7),
        RankedArtwork("c", 6),
        RankedArtwork("d", 6),
        RankedArtwork("e", 6),  # 5th candidate, should be dropped by the cap
        RankedArtwork("f", 4),  # below the Tier 2 floor entirely
    ]
    result = classify(ranked, Settings())
    assert result.tier == "did_you_mean"
    assert result.artwork_ids == ["a", "b", "c", "d"]


def test_tiering_did_you_mean_never_pads_with_sub_floor_guesses():
    """Design brief 3.4 / Tech Arch Section 2: fewer than 4 real candidates
    must never be padded out with noise-level guesses just to fill slots."""
    ranked = [RankedArtwork("a", 7), RankedArtwork("b", 4), RankedArtwork("c", 2)]
    result = classify(ranked, Settings())
    assert result.tier == "did_you_mean"
    assert result.artwork_ids == ["a"]


def test_tiering_no_match():
    ranked = [RankedArtwork("a", 5), RankedArtwork("b", 3)]
    result = classify(ranked, Settings())
    assert result.tier == "no_match"
    assert result.artwork_ids == []


def test_tiering_empty_ranked_list_is_no_match():
    assert classify([], Settings()).tier == "no_match"
