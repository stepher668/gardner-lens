# Pilot photo assets

Two folders, each with the 7 slugs from
`backend/app/seed/data/pilot_metadata.json`:

```
data/pilot/
  display/
    el-jaleo/                                          1 clean photo
    europa/
    dormition-and-assumption-of-the-virgin/
    presentation-of-the-christ-child-in-the-temple/
    portrait-of-isabella-stewart-gardner/
    isabella-stewart-gardner-in-venice/
    self-portrait-age-23/
  reference/
    <same 7 slugs>/                                    1+ photos each
  visitor/
    <same 7 slugs>/  (optional - see below)
```

- **`display/<slug>/`** - the single clean museum photo shown in the
  Result drawer and the Collection grid (design brief 3.3: "the clean
  museum reference image, not the visitor's own shot"). One photo is
  enough; if more than one is present, the seed script uses the first
  (alphabetically).
- **`reference/<slug>/`** - the photo(s) the ORB matching pipeline is
  built from (Tech Arch Section 2). Per that doc, 1 straight-on shot is
  the minimum, up to 3-4 additional real angles where they exist - no
  dedicated photo shoot required, the Museum's existing professional
  photography is sufficient.
- **`visitor/<slug>/`** - optional, genuine held-out visitor-style test
  photos. Only used for re-running the held-out accuracy check from PRD
  Section 12 (not read by the app itself, and not required for it to
  work).

**If a piece's `display/` or `reference/` folder is empty or missing**,
the seed script (`backend/app/seed/seed_pilot.py`) falls back gracefully
rather than failing:
- `reference/` empty → generates a clearly-labeled placeholder image (a
  matching pipeline needs *something* to index).
- `display/` empty → reuses the first real `reference/` photo instead of
  generating a separate placeholder, since that's already a real museum
  photo of the piece.

Placeholders are visibly stamped "PLACEHOLDER" and logged loudly when
generated, and are gitignored (`data/pilot/**/placeholder_*.jpg`) so one
never accidentally gets committed as if it were real content. Real photos
always win over a placeholder once present.
