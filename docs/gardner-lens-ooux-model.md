# OOUX / ORCA: Gardner Museum Collection Domain Model
### For Gardner Lens · Draft v1 · July 23, 2026

**Scope note**: This models the Museum's *collection* domain specifically (Artwork, Creator, Category, Room, Floor) — not concerts, plants, cafe, gift shop, provenance/former-ownership, or special/temporary exhibitions. Those were explicitly considered and scoped out.

---

## Objects

1. **Artwork**
2. **Creator** — broad definition: person, workshop, organization, or culture/nationality attribution (matches the Museum's own real data, e.g. "Unknown," "The United States Mint," "German, Saxony"). Renamed from "Artist" to match the object-detail-page term (the Museum's search filter still says "Artist" — a known site inconsistency we're not inheriting).
3. **Category** — object type/medium (Paintings, Armor, Vessels, Architectural Elements, etc.)
4. **Room** — includes the Courtyard, which the Museum treats as its own Room on Floor 1 despite spanning multiple floors physically
5. **Floor** — the palace's 3 public floors

**Explicitly out of scope for this exercise**: Provenance/Former Owner, Special/Temporary Exhibitions (both real, both adjacent, both deliberately deferred).

---

## Relationships

| From | To | Relationship | Cardinality | Notes |
|---|---|---|---|---|
| Artwork | Creator | "involves," role-qualified | Many : Many | Role (author/artist/publisher/editor/subject/etc.) lives on the join, not on Creator itself — same person can hold different roles on different pieces. Unified list, not split into "made by" vs. "depicts" (matches real site behavior). |
| Artwork | Category | "classified as" | Many : One | |
| Artwork | Room | "located in" | Many : One | Every Artwork always has a Room, even Off View (its *normal* room). Storage/off-site location explicitly out of scope — a visitor can never photograph something not in a public gallery. |
| Room | Floor | "located on" | Many : One | No exceptions — Courtyard included. |

---

## Attributes

### Artwork
| Attribute | Priority | Notes |
|---|---|---|
| Title | Core | |
| Date (display string) | Core | e.g. "about 1580–1589" — matches real site's flexible date text |
| Date (normalized start/end year) | Core | Derived century comes from this, never hand-maintained. A range spanning two centuries (e.g. "about 1490–1510") belongs to **both**. |
| Description | Core | |
| Image(s) | Core | |
| Status (On View / Off View) | Core | Gates whether Gardner Lens should ever try to match it |
| Medium/materials | Secondary | |
| Accession number | Secondary | Internal-facing |

### Creator
| Attribute | Priority | Notes |
|---|---|---|
| Name | Core | |
| Creator Type (Person / Organization / Culture-or-Unknown) | Core | Controls display phrasing around the date/place fields below (e.g. "b. 1599, Seville – d. 1660" vs. "active New York, 1878–1891") — a presentation-layer flag, not a second date schema |
| Nationality/Culture | Core | |
| Date range (start/end year) | Core | Generic shape, covers both life-dates and active-periods |
| Place (start/end) | Core | Generic shape, covers birthplace/deathplace or active-location |
| Bio | Secondary | |

### Category
| Attribute | Priority |
|---|---|
| Name | Core |

### Room
| Attribute | Priority | Notes |
|---|---|---|
| Name | Core | |
| Description | Secondary | |
| Photo | Secondary | Could enrich "Similar Artwork" cards later |

### Floor
| Attribute | Priority |
|---|---|
| Name/Number | Core |

---

## CTAs

### Artwork
| CTA | Notes |
|---|---|
| Scan/Identify (take a photo) | Core, unique CTA |
| View Details | Title, date, description, image |
| **View Similar Artwork** | **Finalized (superseding an earlier "separate screen" direction):** not a distinct CTA/screen — a single section on the result screen itself, capped at **3 cards**, each tagged with *why* it's related (Same Creator / Same Room / Same Floor), per Steph's refined sketch. No unlabeled blended list. |
| Add to Your Collection | Automatic on successful match, not a separate visitor action |

### Creator / Room / Floor
No independent drill-down destinations. Card-only, always encountered *through* an Artwork (via "View Similar Artwork") — consistent with the camera-first, no-manual-browse decision, and confirmed to apply for the full scope of this exercise, not just the pilot.

### Category / Era / Region
No CTA. Intentionally deferred as future similarity dimensions.

### Session-level (not tied to one object)
- New Pic
- View Your Collection
- Email Me
- View Courtyard Plant reveal

---

## Open Items Carried Forward (not blockers, just not to lose)
1. **Multi-Creator display copy**: "Title / Creator / Year" needs a rule for how multiple creators with different roles render (e.g. "Workshop of X, with contributions attributed to Y"), and "Similar Works → Same Creator" needs a rule for *which* creator(s) on a multi-attributed piece it pivots off.
2. **Honest copy for non-maker roles**: "Same Creator" results could include pieces where the creator's role was "subject," not "maker" — copy should avoid implying authorship it can't back up.
3. **Similar Works selection rule (pilot, fixed priority — not a scoring model)**: show up to 3 cards. Fill 1 slot max with Same Creator, then prioritize Same Room over Same Floor for remaining slots. This is a simple fixed-priority rule, deliberately not a weighted algorithm.
4. **Future direction, explicitly flagged, not scoped now**: a real weighted-scoring model (e.g. Creator + Floor could outrank plain Same Room; Floor + Category could outrank plain Same Room) is a plausible v2 — noted here so the architecture doc doesn't accidentally treat the pilot's fixed priority order as a permanent design decision.
5. **Data check before the reference-photo shoot**: confirm the 6 pilot pieces actually have real Same Room / Same Floor overlap with each other (not just the confirmed Same Creator pairing — El Jaleo and ISG Portrait are both John Singer Sargent). Otherwise "Similar Works" may come up empty on 2 of 3 tag types in the demo.
