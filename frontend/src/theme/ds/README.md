# Design system (imported verbatim)

Everything in this folder (`tokens/`, `fonts/`, `styles.css`) is copied
unmodified from the Claude Design export (`Museum_Photo_Recognition_App.zip`,
imported 2026-08-21) - the real gardnermuseum.org "isgm17" theme design
brief Section 6 references. Don't hand-edit these files; if the design
system changes, re-export from Claude Design and re-copy this folder
wholesale so it can't silently drift from the source of truth.

`../tokens.css` is the app-specific layer on top of this: it imports
`styles.css` (which pulls in every token file + the four `@font-face`
declarations) and adds only what the app itself needs beyond the raw
tokens (focus-visible convention, a couple of small utility classes).

Real components matching this system's `Button`/`IconTextButton`/`Card`/
`Input` (reimplemented from the export's `_ds_bundle.js` as TypeScript,
since that bundle format targets Claude Design's canvas runtime, not a
normal Vite import) live in `frontend/src/ds/`.
