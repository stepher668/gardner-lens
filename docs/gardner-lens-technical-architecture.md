# Technical Architecture: Gardner Lens
### For use with Claude Code · Draft v2 · August 10, 2026

**Status:** Draft, synthesizing validated decisions from the engineering spike, OOUX model, and design brief. A few genuinely open implementation choices are flagged in Section 9 rather than silently decided — everything else here reflects work already done and tested in this project.

---

## 1. System Overview

```
┌──────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Frontend (PWA)   │ ───▶ │  Backend API           │ ───▶ │  Data Store       │
│  from Claude       │      │  (recognition,         │      │  (Artwork,         │
│  Design handoff     │      │   collection, email)   │      │   Creator, Room,   │
│                    │      │                        │      │   Floor, Category, │
│                    │ ◀─── │                        │ ◀─── │   ReferencePhoto)  │
└──────────────────┘      └──────────────────────┘      └─────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │  Matching Engine        │
                           │  (ORB + ratio test        │
                           │   + RANSAC, validated      │
                           │   in spike)               │
                           └──────────────────────┘
```

No GPU, no ML training pipeline, no third-party vision API — the validated approach (Section 2) runs on ordinary compute. This meaningfully simplifies hosting compared to the PRD's original two candidate approaches.

## 2. Recognition Pipeline (Validated)

This is not a proposal — it's what was directly tested against real Museum photos across nine rounds of spike testing, with results, including a final round testing the full 7-piece pilot set with a clean professional/visitor photo split.

**Pipeline, per visitor photo:**
1. Frontend compresses the captured image before upload (wifi-only assumption from PRD — don't send full-res unnecessarily)
2. Backend extracts ORB keypoints/descriptors from the uploaded photo
3. For each candidate reference photo in the index: `knnMatch` (k=2) → **ratio test** (discard ambiguous matches, keep only those where the best match is unambiguously better than the second-best) → **RANSAC geometric verification** (discard matches that aren't spatially consistent with a real camera-angle transformation)
4. The surviving "inlier" count is the confidence score for that reference photo
5. Take the best score across all reference photos, across all artworks
6. **Confidence threshold** (starting point: 8 inliers, tuned during the spike — needs re-validation at real launch scale, not assumed permanent): above → confident match; below → low-confidence fallback

### Data requirement — final, superseding the earlier "3–5 photo shoot" plan

**Earlier draft of this doc said each artwork needs 3–5 real reference photos from a dedicated volunteer photo shoot. That's now superseded by direct testing.** The validated requirement is simpler and meaningfully lower-effort:

**Use whatever real professional photos the Museum already has — 1 straight-on shot minimum, up to 3 additional real angles where they exist. No dedicated photo shoot required.** Tested across all 7 pilot pieces (1–3 real professional photos per piece, genuine held-out visitor-style query photos, never seen by the reference index):

| Result | Value |
|---|---|
| Confident matches, correct | 6/6 (100%) |
| Confident matches, wrong | **0** |
| Flagged low-confidence ("please retry") | 8/14 (57%) |

**Zero false positives across the entire pilot set, using only existing photos.** This is the headline validated finding, and it directly answers a real barrier to Museum adoption (see Section 9 in the PRD): unlike a vendor requiring extensive new photography across the ~18,000+ piece collection, this approach works with the imagery the Museum already has.

**The honest cost**: a 57% low-confidence rate is real, not a footnote. Two pieces specifically — **Isabella Stewart Gardner (Sargent portrait)** and **Self Portrait, Age 23 (Rembrandt)** — got zero confident matches at all with their current photo counts (2–3 photos each), though never a wrong answer. If more real angles become available for those two specifically, that's the highest-leverage way to close the gap — not a blanket photo shoot across all 7.

### Synthetic augmentation — tested and explicitly rejected

Three configurations were tested to see if synthetic image manipulation could close the coverage gap without needing more real photos:

| Configuration | Confident & correct | Wrong confident | Low-confidence |
|---|---|---|---|
| **A: Real photos only (validated, adopted)** | 6/6 (100%) | **0** | 8/14 |
| B: + lighting-only synthetic variants | 9/10 (90%) | 1 | 4/14 |
| C: + angle+lighting synthetic variants | 8/10 (80%) | **2** | 4/14 |

**Every synthetic configuration traded away the zero-false-positive guarantee for modest coverage gains, and Configuration C (the most aggressive) was strictly worse than B on both counts.** Visual inspection confirmed why: a synthetic warp only rearranges pixels already present in a photo — it can't invent the real optical information (genuine reflections, real shadow shape shifts, actual different-angle detail) that a second real photo captures. Pieces with less inherent local texture (e.g. the Sargent portrait's large uniform dark dress) suffer more from this gap than busy, high-contrast pieces (e.g. El Jaleo). **Decision: no synthetic augmentation of any kind in the production pipeline.**

**Known weak spot**: wide/cluttered shots with multiple pieces in frame are meaningfully less reliable — this is why the design brief's capture screen includes a framing hint.

### Three-tier confidence model (finalized August 10, 2026)

Validated with the same held-out visitor photos used throughout this section. Motivated by a real gap: even the safest configuration (real photos only) leaves a majority of harder photos in a flat "low confidence" bucket — but a meaningful share of those cases have the correct piece sitting just below the auto-match threshold, sometimes as the algorithm's actual top-ranked guess. Rather than discard that signal, a human can resolve it, if it's presented honestly.

| Tier | Threshold | Behavior |
|---|---|---|
| **1 — Confident Match** | ≥ 8 inliers | Auto-display the full result screen. Existing, most rigorously validated threshold in this pipeline. |
| **2 — Candidate List ("Did You Mean?")** | 6–7 inliers | Show up to 4 candidates whose *individual* score clears 6, ranked highest-first, as tappable thumbnails (real reference images, not just names — the visitor is doing the recognition work the algorithm couldn't finish). Visitor taps theirs, or indicates none match. If fewer than 4 candidates clear the floor, show fewer — never pad the list with noise-level guesses just to fill slots. |
| **3 — No Match** | All candidates < 6 inliers | Existing plain retry prompt. No candidate list — at this level scores are statistically indistinguishable from comparing two unrelated images, and showing a list would look like signal that isn't there. |

**Where the 6-inlier floor comes from**: across every round of testing in this project, pure noise (scoring two genuinely unrelated images against each other) has consistently landed at 4–5 inliers — including the very first resolution diagnostic (a low-res query scored 4–5 against every piece, correct and incorrect alike). Genuine near-misses — cases where the true piece was recoverable, just short of the confident threshold — clustered at 6–7, and in two tested cases was actually the algorithm's #1-ranked guess despite falling short of Tier 1. That gap is the empirical basis for the floor.

**Honest caveat**: this floor is reasoned from 14 holdout queries, not validated with the same depth as the 8-inlier Tier 1 threshold (which was tested across nine full rounds). Treat it as a tunable starting point, not a permanent constant — worth re-examining once real visitor data exists post-launch.

**Interaction with multi-object photos**: a photo containing more than one recognizable piece (see the Giotto+Sargent portrait test) may naturally produce multiple candidates clearing the Tier 2 floor simultaneously. This is graceful, appropriate behavior under this model — better than a flat "no match" for a photo that does contain real, identifiable content — not a bug to guard against.

**Data/schema implication**: the `/identify` endpoint (Section 7) needs to return a ranked candidate list, not just a single best-guess object, so the frontend can render Tier 2's "Did You Mean?" state. This is a response-shape decision, not a new capability — the underlying per-piece scores already exist in the matching pipeline; they just weren't previously surfaced past the top pick.

**Resolution matters, separately from augmentation**: a diagnostic test against an unrealistically small (201×251px) query image showed the correct reference scoring only 4–5 inliers — statistically indistinguishable from wrong pieces. This isn't a matching-algorithm flaw; there's insufficient real detail surviving at that resolution for any local-feature approach. Confirmed this isn't a real deployment concern, since actual visitor phone photos will be far higher resolution — but worth keeping in mind if client-side compression is ever tuned aggressively.

### Deferred: open-source embedding-based matching (for Claude Code to test)

**Not yet executed — blocked in the exploratory chat sandbox by network restrictions (no access to Hugging Face or PyTorch's weight-hosting CDNs), not by feasibility.** Worth running early in the Claude Code build, since it directly targets the 57% low-confidence rate using the *same* minimal photo set — no additional Museum photography required either way.

**Goal**: determine whether an open-source deep embedding model (not a paid API — see PRD Section 9 for why that distinction matters) can reduce the low-confidence rate below Configuration A's 57%, using the exact same 1–3 photos per piece, *without* reintroducing false positives.

**Test spec:**
1. **Reference set**: the same 16 professional photos across all 7 pieces used in the validated ORB test (available in this conversation's uploads: `_professional.zip`).
2. **Query set**: the same 14 genuine visitor-style holdout photos (`_visitor.zip`) — same split, so results are directly comparable to Configuration A/B/C above.
3. **Models to try**: CLIP (ViT-B/32 is a reasonable starting point) and DINOv2. Worth testing both, not just one — CLIP is trained for image-text alignment (more "semantic/categorical"), while DINOv2 is self-supervised and specifically strong at fine-grained instance-level visual similarity, which is closer to this task's actual need (distinguishing *this specific* painting from other similar-style paintings, not just "a painting").
4. **Method**: compute an embedding for every reference photo; compute an embedding for every query photo; score = cosine similarity; best match = highest similarity per piece.
5. **Threshold calibration**: cosine similarity isn't directly comparable to the ORB inlier count — calibrate a confidence threshold against this same held-out set, choosing the threshold that keeps false positives at zero (matching Configuration A's guarantee), then see how much of the 57% low-confidence pool moves to confident-correct at that threshold.
6. **Also worth testing**: a hybrid where embeddings produce a candidate shortlist and ORB+RANSAC still performs final geometric verification — combining the embedding's resolution/texture robustness with ORB's proven zero-false-positive precision, rather than replacing one approach with the other outright.
7. **Success criteria**: any embedding approach is only worth adopting if it matches or beats Configuration A's zero-false-positive result while improving on the 57% low-confidence rate. Matching ORB's coverage with *more* false positives is a regression, not an improvement, regardless of the raw "confident and correct" number.

**Scale note (not a pilot concern, but on record for when the collection grows beyond ~7 pieces)**: a two-stage hybrid (cheap shortlist filter → expensive verification only on the shortlist) was tested and preserved accuracy while cutting expensive comparisons — but the shortlist filter itself needs to be smarter than simple color-histogram matching before trusting it at full collection scale (~2,500 pieces). At 7 pilot pieces, brute-force verification against every reference photo is fast enough that no shortlist stage is needed yet. The embedding test above, if it pans out, is a plausible candidate for that eventual shortlist filter too — worth keeping in mind as a shared solution to both problems rather than two separate ones.

## 3. Data Model

Full detail lives in `gardner-lens-ooux-model.md` — this section maps that model to an actual schema.

### Core tables/collections

**Artwork**
| Field | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| title | string | |
| date_display | string | e.g. "about 1580–1589" |
| date_start_year | int, nullable | normalized, for future era grouping |
| date_end_year | int, nullable | a range can span multiple centuries — don't collapse to one |
| description | text | |
| status | enum: on_view / off_view | Off View still has a "normal" Room, per OOUX decision |
| medium | string, nullable | secondary field |
| accession_number | string, nullable | internal-facing |
| category_id | FK → Category | Many:One |
| room_id | FK → Room | Many:One (always present) |

**ArtworkImage** (separate from ReferencePhoto below — this is the clean display image, not a matching reference)
| Field | Type |
|---|---|
| id | UUID/PK |
| artwork_id | FK → Artwork |
| url | string |

**ReferencePhoto** (matching data, not display data — per design brief, the *result screen* shows the clean ArtworkImage, not these)
| Field | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| artwork_id | FK → Artwork | |
| image_url | string | |
| orb_descriptors | binary/serialized | precomputed once at ingest, not per-request |

**Creator**
| Field | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| name | string | |
| creator_type | enum: person / organization / culture_or_unknown | controls display phrasing |
| nationality_culture | string, nullable | |
| date_start / date_end | int, nullable | generic — covers both life-dates and active-period |
| place_start / place_end | string, nullable | generic — covers birthplace/deathplace or active-location |
| bio | text, nullable | secondary |

**ArtworkCreator** (join table — this is where role lives, per OOUX)
| Field | Type |
|---|---|
| artwork_id | FK → Artwork |
| creator_id | FK → Creator |
| role | string (author / artist / publisher / editor / subject / etc.) |

**Category**
| id, name |

**Room**
| id, name, floor_id (FK → Floor), description (nullable), photo_url (nullable) |

**Floor**
| id, name |

### Explicitly not modeled (per PRD/OOUX scope decisions)
Provenance/former ownership, special/temporary exhibitions, storage locations beyond "normal room."

## 4. Similar Works Algorithm

Implements the finalized rule from the OOUX doc — a fixed priority order, not a scoring model:

```
function getSimilarWorks(artwork, cap=3):
    results = []
    
    # 1. Same Creator (max 1 slot)
    creator_matches = artworks sharing any creator_id with `artwork`
    if creator_matches:
        results.append(pick 1 from creator_matches, tagged "Same Creator")
    
    # 2. Same Room (fills remaining slots first)
    remaining = cap - len(results)
    room_matches = artworks where room_id == artwork.room_id, excluding results
    results.extend(pick up to `remaining` from room_matches, tagged "Same Room")
    
    # 3. Same Floor (fills any slots still remaining)
    remaining = cap - len(results)
    floor_matches = artworks where room.floor_id == artwork.room.floor_id,
                    excluding artwork's own room and results
    results.extend(pick up to `remaining` from floor_matches, tagged "Same Floor")
    
    return results  # may be fewer than `cap` — 1-card results are valid, not bugs
```

**Validated against the real 7-piece pilot dataset** (see PRD Section 10): every piece returns at least 1 result, none come up empty. "Portrait of Isabella Stewart Gardner" is the only piece where all three tiers apply simultaneously — useful as a test case in development, since it's the one place a bug in the priority order would actually be visible.

**Explicitly reserved, not built**: Category, Era, and Region as additional tiers. The schema already supports Category as a query dimension (it's a real field on Artwork) — adding it as a Similar Works tier later is a logic change, not a schema change.

**Explicitly out of scope for now, flagged for later**: a weighted-scoring model (e.g. Creator+Floor outranking plain Same Room) was discussed and deliberately deferred — don't let the pilot's simple fixed-priority rule get treated as a permanent design decision when this gets revisited.

## 5. Courtyard Plant Algorithm (Phase 4)

Two layers: an individual vote per photographed piece, then a collection-level aggregation with a strict tiebreak order. Deliberately reuses patterns already validated elsewhere in this doc (fixed-priority-fill, same as Similar Works) rather than introducing new architectural concepts.

### 5.1 Individual vote, per artwork

```
getIndividualVote(artwork):
    if artwork has Isabella Stewart Gardner as Creator, role="subject":
        return {plant: BIOGRAPHICAL_PLANT, tier: 0}   # e.g. Lacy Tree Fern
    
    pool = seasonalPool(today's date)   # the always-on 4 are excluded UNLESS pool is empty
    
    return firstMatch(pool, in order: [
        moodEnergyMatch,      # tier 1
        categoryParallelMatch, # tier 2
        floriographyMatch      # tier 3
    ])
    # falls back to the always-on 4 (tier 4) only if the seasonal pool produced no match at all
```

### 5.2 Collection-level aggregation

```
getCollectionPlant(session):
    votes = [getIndividualVote(a) for a in session.artworks]
    
    winner = plant(s) with the most votes (plurality, not blended scoring)
    if exactly one winner: return winner
    
    # tiebreak 1: lowest tier number among the tied plants' contributing pieces
    #   (0=Biographical beats 1=Mood beats 2=Category beats 3=Floriography)
    narrow to whichever tied plant(s) have the most confident contributing match
    if exactly one remains: return it
    
    # tiebreak 2 (final): walk session.artworks in scan order,
    # return the first one whose plant is among the still-tied leaders
    return firstMatchInScanOrder(session.artworks, still-tied leaders)
```

**Validated against all 7 pilot pieces, across 3-piece, 5-piece, and full-7 combinations** — every case resolves to a single deterministic winner, including a case that would otherwise be a genuine 3-way tie with no distinguishing signal. Confirmed specifically: Isabella-subject pieces no longer automatically dominate a collection — they only win when they actually have the votes or win a tiebreak on merit (e.g. El Jaleo + Europa + ISG in Venice correctly resolves to Agapanthus, 2 votes to 1, not to the Isabella-biographical pick).

**Trigger condition** (per PRD Phase 4): only surfaced after 3+ pieces photographed — the algorithm itself works at any N≥1, but the product doesn't show it until then.

### 5.3 Explanatory sentence (LLM-generated, precomputed and cached — not live per-visitor)

The Collection screen should pair the winning plant with a short sentence tying it back to what the visitor actually photographed, in the Museum's own documented tone (the "Notes:" style from their plant reference material — plain, factual, warm, not cutesy).

**Architecture, decided now; actual prompt/copy deferred:**
- **Not a live API call per visitor.** The winning plant for any given input is fully deterministic (Section 5.2), so the sentence-generation space is bounded and enumerable — every possible outcome can be generated once, offline, and cached.
- **Cache key: `(winning_plant_id, contributing_artwork_id_1, contributing_artwork_id_2_or_null)`** — not the visitor's full collection. Two different visits that happen to produce the same winning plant from the same 1–2 contributing pieces reuse the same cached sentence. This is what keeps the precompute space small even though the number of *possible visitor collections* is much larger.
- **Placeholders for up to 2 contributing pieces**, per your requirement. When more than 2 pieces contributed to the winning vote, selection rule: take the first 2, in scan order, among the pieces whose individual vote matched the winning plant — same "first-scanned" logic already established in Section 5.2, so there's only one ordering rule in this whole feature, not two competing ones.
- **Precompute job**: run once per season change (since the seasonal pool rotates ~9 times/year, not continuously) across the pilot's 7 artworks — a small, one-time batch, not an ongoing cost.
- **Fallback required**: if a visitor's session somehow produces a combination not in the cache (shouldn't happen at pilot scale, but don't assume it can't), the UI needs a plain non-generated fallback sentence (e.g. "Today's courtyard plant: {plant_name}") rather than blocking or showing an error — this is the app's first external-dependency failure mode, and it shouldn't be able to break the Collection screen.

### 5.4 New data needed
- **Plant**: id, common_name, latin_name, place_of_origin, notes, seasonal_window_start/end (nullable if always-on), always_on (bool), mood_tags, category_tags, floriography_tags
- **PlantSentenceCache**: cache key as above, generated_sentence (text)
- **Isabella-subject biographical mapping**: small, hardcoded (which plant(s), tied to her real documented plantings)
- **Seasonal bloom calendar**: approximate date ranges per the Museum's real annual display calendar — worth a yearly touch-up note, since actual bloom timing is weather-dependent, not fixed
- **Explicitly deferred**: a `depicts_child` marker on Artwork (would support the Baby's Tears exclusion rule) — not built now, flagged here only so its absence isn't mistaken for an oversight later

## 6. Session & Collection Model

- **No login** (confirmed, PRD Phase 3) — anonymous, session-based
- Session identifier stored client-side (cookie or local storage), tying together the visitor's photographed pieces for that visit
- Backend needs a lightweight `Session` or `Visit` concept: session_id → list of artwork_ids photographed, **in scan order** (now load-bearing, not just informational — Section 5.2's final tiebreak depends on it), with timestamps
- Session data doesn't need to be a durable user account — it just needs to survive a single visit and support the Email Me action within a **24-hour TTL** (finalized, Section 9)

## 7. API Surface (draft)

| Endpoint | Purpose |
|---|---|
| `POST /identify` | Upload a photo → run matching pipeline → returns one of three shapes per the three-tier confidence model (Section 2): confident match (single artwork detail), candidate list (up to 4 ranked artworks for "Did You Mean?"), or no-match |
| `GET /artwork/:id` | Full artwork detail (title, creator(s), date, description, image) |
| `GET /artwork/:id/similar` | Similar Works, per Section 4 |
| `GET /collection/:session_id` | Everything photographed this visit |
| `POST /collection/:session_id/email` | Send the take-home list |
| `GET /courtyard-plant?session_id=:session_id` | Phase 4 — runs Section 5.2, returns winning plant + cached sentence (Section 5.3), falling back to the plain template sentence on a cache miss |

## 8. Frontend

The frontend implementation itself is inherited from the Claude Design handoff (Steph's imported gardnermuseum.org-based design system) rather than specified independently here — this document focuses on what Claude Code needs to build that Claude Design doesn't already define: the backend, data model, and recognition pipeline above. The one architectural expectation this doc places on the frontend: it needs to support the Collection-as-home + Result-as-drawer/modal navigation pattern from the design brief, which is a real interaction/state requirement, not just a visual one.

## 9. Accessibility

Per the design brief's priority: this isn't a bolt-on. Concretely for Claude Code:
- All interactive elements need real focus states (the real site's 2px solid currentColor convention is a good default to inherit via the imported design system)
- Alt text on all artwork images (ArtworkImage should probably carry an alt_text field, or generate one from title/creator at minimum)
- The camera-capture flow needs a usable path for visitors relying on screen readers or switch control, even though the core interaction is visual — worth explicit design/dev attention rather than assuming camera UIs are inherently accessible
- Investigate whether the real site's existing `.high-contrast` mode mechanism can be reused rather than building a separate one

## 10. Decisions (Finalized July 23, 2026)

1. **Backend**: Python (FastAPI), consistent with the proven spike code — no rewrite/port needed.
2. **Database**: Postgres, even at pilot scale — avoids a migration step if this grows toward the full ~2,500-piece collection later.
3. **Session TTL**: 24 hours — a visit's collection (and the Email Me action) needs to be usable within that window; no longer-lived storage needed.
4. **Reference photo ingestion**: a simple one-time seed script (photos + metadata in, ORB descriptors precomputed, DB populated) — no admin UI for the pilot.
5. **Courtyard Plant sentence generation**: precomputed and cached, not a live per-visitor LLM call — see Section 5.3 for the bounded-space reasoning that makes this possible.

This document has no remaining open items and is ready for Claude Code.
