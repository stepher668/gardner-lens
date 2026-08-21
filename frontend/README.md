# Gardner Lens - frontend

React + TypeScript + Vite PWA implementing the Phase 1 screens (Landing →
Camera → three-tier match result → Collection). See the repo root
`README.md` for full setup instructions and `../docs/` for the product/
design specs this implements.

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL - defaults to http://localhost:8000
npm run dev
```

- `npm run build` - typecheck + production build
- `npm run lint` - oxlint

## Structure

```
src/
  api/          typed client for the backend (mirrors backend/app/schemas)
  state/        SessionContext - session_id + collection, persisted to
                localStorage
  screens/      Landing, Camera (owns all 3 match-result overlays),
                ResultDrawer, Collection
  components/   shared building blocks, incl. the Phase 2-4 UI teases
                (SimilarWorksTease, EmailMeButton, PlantRevealTease)
  theme/        tokens.css - isolated so the real imported Claude Design
                system can replace it without touching component code
```
