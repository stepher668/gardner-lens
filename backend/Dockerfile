# Build context is the REPO ROOT (see docker-compose.yml's `context: .` /
# the deploy build command), not backend/ - this stage needs to reach
# frontend/ and data/pilot/, both siblings of backend/.

FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin build: no VITE_API_BASE_URL set, so the frontend calls
# relative paths (see frontend/src/api/client.ts) - correct for this
# single-container deploy where the backend serves the built frontend
# itself, wrong for a split frontend/backend deploy.
RUN npm run build

FROM python:3.11-slim

# libgl1/libglib2.0-0 - runtime deps for opencv-python-headless
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY data/pilot /data/pilot
COPY --from=frontend-build /frontend/dist /app/static

ENV GARDNER_LENS_PILOT_DATA_DIR=/data/pilot
ENV GARDNER_LENS_FRONTEND_DIST_DIR=/app/static

EXPOSE 8000

# --if-empty: seed only populates an empty DB, so redeploys against a
# live Postgres never wipe real visitor Collections (app/seed/seed_pilot.py).
CMD ["sh", "-c", "python -m app.seed.seed_pilot --if-empty && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
