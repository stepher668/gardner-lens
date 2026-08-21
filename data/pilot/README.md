# Pilot photo assets

Drop the real pilot photo sets in here before running the seed script
(`backend/app/seed/seed_pilot.py`):

```
data/pilot/
  professional/
    el-jaleo/
      <one or more real professional Museum photos, .jpg/.jpeg/.png>
    europa/
    dormition-and-assumption-of-the-virgin/
    presentation-of-the-christ-child-in-the-temple/
    portrait-of-isabella-stewart-gardner/
    isabella-stewart-gardner-in-venice/
    self-portrait-age-23/
  visitor/
    <same slugs, genuine held-out visitor-style test photos - optional,
     only needed for re-running the held-out accuracy check from PRD
     Section 12, not for the app itself>
```

The slugs above match `backend/app/seed/data/pilot_metadata.json`.

**If a piece's `professional/<slug>/` folder is empty or missing**, the seed
script generates a clearly-labeled placeholder image in its place instead
of failing, so the matching pipeline stays runnable/testable end to end.
Placeholders are visibly stamped "PLACEHOLDER" and logged loudly when
generated - they are never a stand-in for real photography once real
photos exist, and the seed script always prefers a real photo over a
placeholder when both are present.

Per the technical architecture doc (Section 2), 1 straight-on shot is the
minimum, up to 3 additional real angles where they exist - no dedicated
photo shoot required, the Museum's existing professional photography is
sufficient (validated with zero false positives across all 7 pieces).
