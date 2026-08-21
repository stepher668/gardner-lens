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

The UI is built from the real Claude Design export (`Museum_Photo_
Recognition_App.zip`, imported 2026-08-21): real DTL Elzevir/Futura PT
fonts, real design tokens, and real Button/Card/IconTextButton components
- see `frontend/src/theme/ds/README.md`.

## Layout

```
/backend         FastAPI + Postgres + the ORB/RANSAC matching pipeline
/frontend        React + TypeScript + Vite PWA
/data/pilot/     drop real pilot photos here (see data/pilot/README.md)
docker-compose.yml   Postgres + backend for local dev
```

## Before this goes anywhere near the real Museum: content status

Real pilot photos are in (`data/pilot/display/` + `data/pilot/reference/`,
7 pieces). Curatorial copy (date/description/medium/creator bios) is also
filled in, but **it's sourced from the Claude Design prototype's copy, not
confirmed Museum records** - see the `_comment` at the top of
`backend/app/seed/data/pilot_metadata.json` and the warning the seed
script prints on every run. Treat it as a strong placeholder, not final
text to show the Museum. `accession_number` is still `TODO_CONTENT` -
never provided anywhere.

If a future piece is added without real photos, the seed script falls
back to a clearly-labeled generated placeholder rather than failing (see
`data/pilot/README.md`).

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

### Deploying (a real HTTPS URL you can open on your phone)

`docker compose` above runs frontend and backend as two separate dev
processes, but `backend/Dockerfile` builds a **single** deployable image -
the backend serves the built frontend from the same origin (one URL, no
CORS to configure). Mobile browsers only grant camera access over HTTPS,
so this - not local dev - is what "try it on my phone" actually needs.
See `docs/deployment.md` for the exact steps (Render: create Postgres,
create a Docker web service pointed at `backend/Dockerfile` with the repo
root as build context, set one env var, deploy).

## Where things stand vs. the source docs

- **Matching pipeline**: implements Technical Architecture Section 2
  exactly - ORB + ratio test + RANSAC, the 8/6-inlier three-tier
  thresholds, brute-force verification (no shortlist stage - fine at 7
  pilot pieces per that doc's own scale note).
- **Data model**: matches the OOUX model / Tech Arch Section 3 field for
  field; multi-creator display honesty (OOUX "Open Items" #1/#2) is
  implemented in `backend/app/schemas/formatting.py`.
- **Similar Works, Email Me, Courtyard Plant**: UI-only teases (Phase
  2-4), not backed by real endpoints yet - see the inline comments in
  `frontend/src/screens/ResultDrawer.tsx` and `Collection.tsx`.
- **Accessibility**: focus states, alt text, real text labels on
  candidates, and an accessible file-input camera fallback are implemented
  per design brief Section 4 / Tech Arch Section 9. High-contrast mode is
  explicitly **not** built this pass - the Claude Design export has no
  `.high-contrast` mechanism to reuse (confirmed absent from every token/
  CSS file it contains), and per user direction (2026-08-21) it's deferred
  rather than hand-rolled against tokens that might not match a future
  real one.
- **Design system**: `frontend/src/theme/ds/` (tokens/fonts/styles.css)
  and `frontend/src/ds/` (Button/IconTextButton/Card/Input) are pulled
  directly from the Claude Design export, not hand-authored - see
  `frontend/src/theme/ds/README.md` before editing either.
