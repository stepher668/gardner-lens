# Deploying Gardner Lens (Render)

The repo is fully ready for this — single Docker image, backend serves
the built frontend from the same origin, real pilot photos baked in,
idempotent seeding. This doc is the exact path to a live HTTPS URL. Do
this from your own browser/terminal, not through a Claude Code sandbox -
cloud-provider APIs and `*.onrender.com` itself aren't reachable from
there (an environment network policy, not a Render-specific issue).

Everything below assumes the code already on
`claude/phase-1-ui-claude-design-1d77cn` (or `main`, once merged).

## 1. Create the database

Render dashboard → **New +** → **PostgreSQL**.
- Name: `gardner-lens-db` (or anything)
- Plan: Free is fine for trying this out
- Create it, then open it and copy the **Internal Database URL** (starts
  `postgres://...`) - you'll need it in step 3.

## 2. Create the web service

Render dashboard → **New +** → **Web Service** → connect the
`stepher668/gardner-lens` GitHub repo → branch
`claude/phase-1-ui-claude-design-1d77cn` (or `main`).

- **Runtime**: Docker
- **Dockerfile Path**: `backend/Dockerfile`
- **Docker Build Context Directory**: repo root (`.`) - if Render's UI
  shows this as a separate field, it must be the repo root, not
  `backend/`. The Dockerfile reaches into `frontend/` and `data/pilot/`,
  both siblings of `backend/`, so a `backend/`-scoped context will fail
  the build. (If you don't see a separate context field, Render is
  already defaulting to repo root - nothing to change.)
- **Plan**: Free or Starter

Don't deploy yet - add the environment variable first (step 3), or add it
right after and trigger a redeploy.

## 3. Set the database URL

On the web service → **Environment** → add:

```
GARDNER_LENS_DATABASE_URL = postgresql+psycopg2://<everything after postgres://from step 1>
```

Render gives you `postgres://user:pass@host/db`; the app needs the
`postgresql+psycopg2://` scheme (SQLAlchemy + the psycopg2 driver) - copy
Render's URL and just swap the scheme prefix, keep the rest identical.

Nothing else needs setting: `GARDNER_LENS_PILOT_DATA_DIR` and
`GARDNER_LENS_FRONTEND_DIST_DIR` are already baked into the image as
Dockerfile defaults (`/data/pilot`, `/app/static`).

## 4. Deploy

Save/create → Render builds the image and deploys it. First build takes a
few minutes (compiles the frontend, installs Python deps incl. OpenCV).
Watch the build log for the seed step:

```
seeded 'El Jaleo' with 2 reference photo(s), display: el-jaleo-1.jpg
...
Done.
```

That only happens once - `seed_pilot.py --if-empty` (the container's
start command) skips seeding on every subsequent boot/redeploy once the
`artworks` table has rows, so redeploys never wipe real visitor
Collections.

## 5. Verify

Render assigns a URL like `https://gardner-lens.onrender.com`.

```bash
curl https://<your-service>.onrender.com/health
# {"status":"ok","reference_artworks_indexed":7}
```

Then open that URL on your phone: Landing → tap the Gardner Lens card →
grant camera permission (needs HTTPS to even prompt - this is exactly why
a local/HTTP setup can't be used for this) → photograph one of the 7
pilot pieces (or use "Choose a Photo Instead") → confirm a real match with
a real museum image appears.

## Redeploying after a code change

Push to the connected branch - Render auto-deploys on push if "Auto-
Deploy" is on for the service (default). No manual seeding step needed;
`--if-empty` handles it.

## Resetting the seeded data

The seed script's normal (non-`--if-empty`) mode always wipes + rebuilds.
To force a full reset: Render dashboard → web service → **Shell** → run

```
python -m app.seed.seed_pilot
```

(no `--if-empty`) - this wipes all Visits/Collections too, not just the
artwork catalog, so only do this deliberately.
