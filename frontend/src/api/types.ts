// Mirrors backend/app/schemas/schemas.py - keep the two in sync by hand
// until the project is big enough to warrant generating this from the
// OpenAPI schema.

export interface CreatorOut {
  name: string;
  role: string;
  creator_type: "person" | "organization" | "culture_or_unknown";
  nationality_culture: string | null;
  date_start: number | null;
  date_end: number | null;
  place_start: string | null;
  place_end: string | null;
}

export interface ArtworkImageOut {
  url: string;
  alt_text: string;
}

export interface ArtworkDetailOut {
  id: string;
  title: string;
  date_display: string;
  description: string;
  medium: string | null;
  status: string;
  creators: CreatorOut[];
  creator_display: string;
  image: ArtworkImageOut | null;
  room_name: string;
  floor_name: string;
  category_name: string;
}

export interface CandidateOut {
  id: string;
  title: string;
  creator_display: string;
  image: ArtworkImageOut | null;
}

export type IdentifyTier = "confident" | "did_you_mean" | "no_match";

export interface IdentifyResult {
  tier: IdentifyTier;
  session_id: string;
  artwork: ArtworkDetailOut | null;
  candidates: CandidateOut[] | null;
}

export interface CollectionItemOut {
  artwork_id: string;
  title: string;
  image: ArtworkImageOut | null;
  photographed_at: string;
}

export interface CollectionOut {
  session_id: string;
  items: CollectionItemOut[];
  count: number;
}
