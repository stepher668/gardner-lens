# Gardner Lens

Visual artwork identification for the Isabella Stewart Gardner Museum.
Photograph a piece, get what a wall label would have told you - on your own
device, only if you go looking for it. See `docs/gardner-lens-prd.md`,
`docs/gardner-lens-ooux-model.md`, `docs/gardner-lens-design-brief.md`, and
`docs/gardner-lens-technical-architecture.md` for the full product/design/
architecture background this build implements.

**This build is Phase 1** (core identification): camera capture → real
ORB/RANSAC matching → the three-tier confidence result (confident match /
"Did You Mean?" / no match) → Collection as the app's home screen. Similar
Works, Email Me, and the Courtyard Plant section (Phases 2-4) render as
visual teases per the design brief's screens, but aren't functionally wired
yet.

## Layout

```
/backend         FastAPI + Postgres + the ORB/RANSAC matching pipeline
/frontend        React + TypeScript + Vite PWA
/data/pilot/     drop real pilot photos here (see data/pilot/README.md)
docker-compose.yml   Postgres + backend for local dev
```

## Before you start: pilot photos and curatorial copy

The seed script (`backend/app/seed/seed_pilot.py`) will run without real
photos - it generates clearly-labeled placeholder images so the app is
runnable/testable end to end. But it is **not museum-ready** until:

1. Real professional/visitor photos are dropped into `data/pilot/` (see
   `data/pilot/README.md` for the exact folder layout).
2. Real curatorial copy - each piece's date, description, medium, and
   accession number - replaces the `TODO_CONTENT` placeholders in
   `backend/app/seed/data/pilot_metadata.json`. Those four fields are
   genuine Museum cataloging data that isn't in any of the source docs,
   so they were deliberately left as obvious placeholders rather than
   invented.

## Running it locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Postgres via docker-compose (from the repo root):
cd .. && docker compose up -d postgres && cd backend

# Or point GARDNER_LENS_DATABASE_URL at your own Postgres / a local
# SQLite file for quick iteration (sqlite:///./gardner_lens.db) - both
# work, the models don't use Postgres-only types.

python -m app.seed.seed_pilot   # seeds the 7 pilot pieces + ORB index
uvicorn app.main:app --reload   # http://localhost:8000
```

Run the test suite (uses a throwaway SQLite DB, no external services
needed):

```bash
cd backend && python -m pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL, defaults to localhost:8000
npm run dev             # http://localhost:5173
```

`npm run build` and `npm run lint` also work standalone.

### Everything via docker-compose

```bash
docker compose up -d          # Postgres + backend
cd backend && python -m app.seed.seed_pilot
cd ../frontend && npm run dev
```

## Where things stand vs. the source docs

- **Matching pipeline**: implements Technical Architecture Section 2
  exactly - ORB + ratio test + RANSAC, the 8/6-inlier three-tier
  thresholds, brute-force verification (no shortlist stage - fine at 7
  pilot pieces per that doc's own scale note).
- **Data model**: matches the OOUX model / Tech Arch Section 3 field for
  field; multi-creator display honesty (OOUX "Open Items" #1/#2) is
  implemented in `backend/app/schemas/formatting.py`.
- **Similar Works, Email Me, Courtyard Plant**: UI-only teases (Phase
  2-4), not backed by real endpoints yet - see the frontend component
  docstrings (`SimilarWorksTease`, `EmailMeButton`, `PlantRevealTease`)
  and the "Explicitly not in this pass" note in the build plan.
- **Accessibility**: focus states, alt text, real text labels on
  candidates, an accessible file-input camera fallback, and a
  `.high-contrast`-mode hook are all implemented per design brief Section
  4 / Tech Arch Section 9 - see `frontend/src/theme/tokens.css` and
  `frontend/src/components/HighContrastToggle.tsx`. The real site's
  actual high-contrast mechanism should replace the placeholder rules
  there once the Claude Design import lands.
