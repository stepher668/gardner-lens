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
  api/          typed client for the backend (mirrors backend/app/schemas);
                also resolves server-relative image URLs against the API
                origin (see client.ts's resolveImage)
  state/        SessionContext - session_id + collection, persisted to
                localStorage
  screens/      Landing, Camera (owns all 3 match-result overlays),
                ResultDrawer, Collection
  components/   CandidateCard, CollectionGridItem
  ds/           real design-system components (Button, IconTextButton,
                Card, Input) reimplemented from the Claude Design export's
                bundle - see ds/README (once added) or theme/ds/README.md
  theme/
    ds/         tokens/fonts/styles.css copied verbatim from the Claude
                Design export - see theme/ds/README.md before editing
    tokens.css  the app-specific layer on top (imports ds/styles.css +
                global resets/focus states)
```

Similar Works, Email Me, and the Courtyard Plant are visual-only teases in
this pass (Phase 2-4) - see the inline comments in `ResultDrawer.tsx` and
`Collection.tsx` for exactly what's real vs. a placeholder.
