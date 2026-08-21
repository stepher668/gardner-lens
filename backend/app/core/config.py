"""
App-wide settings.

Threshold values here are the finalized numbers from the technical
architecture doc (Section 2, "Three-tier confidence model"):
  - >= TIER1_MIN_INLIERS  -> Tier 1, confident match
  - TIER2_MIN_INLIERS .. TIER1_MIN_INLIERS - 1 -> Tier 2, "Did You Mean?"
  - below TIER2_MIN_INLIERS -> Tier 3, no match

Both are explicitly flagged in the source doc as tunable starting points
(the 8-inlier Tier 1 floor was validated across nine test rounds; the
6-inlier Tier 2 floor is reasoned from 14 holdout queries and is the
less-tested of the two) - kept as settings, not hardcoded, so they can be
re-tuned post-launch without a code change.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="GARDNER_LENS_")

    database_url: str = "sqlite:///./gardner_lens.db"

    # Matching pipeline thresholds (Tech Arch Section 2)
    tier1_min_inliers: int = 8
    tier2_min_inliers: int = 6
    tier2_max_candidates: int = 4

    # Session / collection (Tech Arch Section 6, Section 10 Decision #3)
    session_ttl_hours: int = 24

    # CORS - the Vite dev server origin by default
    cors_origins: list[str] = ["http://localhost:5173"]

    # Directory the seed script reads real/placeholder photos from
    pilot_data_dir: str = "../data/pilot"

    # Built frontend (frontend/dist) to serve as static files, for the
    # single-container deploy (Dockerfile builds the frontend into this
    # path). Left unset for local dev, where the frontend runs separately
    # via `npm run dev` - main.py only mounts it when the directory
    # actually exists, so dev is unaffected.
    frontend_dist_dir: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
