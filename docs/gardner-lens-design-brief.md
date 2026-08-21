# Design Brief: Gardner Lens
### For use with Claude Design · Draft v2 · August 10, 2026

**Status:** Updated with the three-tier confidence model finalized today (Section 3.4, Section 5) — a real, previously-undesigned screen state. Everything else reconciled with the PRD and OOUX model as of the last revision. No open questions remain.

---

## 1. What's Being Designed

The full pilot experience across all 4 phases, since the pilot scope decision was **fully functional, not teased** — this is a real, working app covering 7 Gardner pieces (El Jaleo, Europa, The Dormition and Assumption of the Virgin, The Presentation of the Christ Child in the Temple, Portrait of Isabella Stewart Gardner, Isabella Stewart Gardner in Venice, Self Portrait Age 23 — see PRD Section 10 for full metadata), not a mockup of a bigger future thing.

## 2. Information Architecture

Per your sketches, with two structural changes from the original single-scroll draft — one already decided, one I owe you an answer on from earlier.

**Decided**: "Your Collection" and the courtyard plant get their own separate space, not repeated at the bottom of every artwork result.

**Resolving the modal/drawer question you raised earlier** (which got lost in the CSS/OOUX detour — sorry for leaving that hanging): yes, I think it's the right call, and it also solves a problem I'd flagged as unresolved ("persistent collection-access affordance — TBD"). Instead of inventing a badge or tab, **"Your Collection" becomes the app's actual home/base screen** — empty at first ("Take your first photo to start your collection"), then filling in as the visit continues. Each new **Result opens as a drawer/modal on top of it**, and dismissing that drawer naturally returns to Collection, now updated with the new piece. No separate nav affordance needed — the structure itself does the work.

```
┌─────────────────────┐
│   Entry / Landing    │  "While You're Here" — first-time only  [INDIGO]
└──────────┬───────────┘
           │
           ▼
┌─────────────────────┐
│   Camera Capture     │  Phase 1 — camera-first, no manual search in-app  [ORANGE]
└──────────┬───────────┘
           │
     ┌─────┼──────────────┐
     ▼     ▼              ▼
┌────────┐ ┌────────────┐ ┌──────────────────────┐
│ Tier 3  │ │  Tier 2      │ │  Tier 1                │
│No Match │ │"Did You Mean?"│ │  Confident Match        │
│(overlay │ │up to 4 tappable│ │  → Result opens as    │  [ORANGE — all three tiers]
│on camera,│ │candidates,    │ │  drawer/modal, on top │
│retry loop)│ │visitor picks │ │  of Collection        │
└────────┘ │or "none of   │ └──────────┬────────────┘
           │these"        │            │
           └──────┬───────┘            │
                   │ visitor picks one  │
                   ▼                    │
                   └────────────────────┤
                                         │ dismiss drawer
                                         ▼
           ┌─────────────────────────┐
           │  Your Collection          │  ← the app's home/base screen  [ORANGE]
           │  (persistent, updates     │     Phase 3: everything photographed
           │   as pieces are added)    │     + Email Me
           │  ┌─────────────────────┐  │
           │  │ Courtyard Plant       │  │  Phase 4  [GREEN — section within
           │  │ reveal section        │  │            the page, not a new screen]
           │  └─────────────────────┘  │
           │  "New Pic" → back to      │
           │  Camera Capture           │
           └─────────────────────────┘
```

## 3. Screens, in Detail

### 3.1 Entry / Landing
- Echoes the real site's existing "While You're Here" language (nice continuity if this is ever pitched internally)
- Single clear action: open camera
- Per your sketch: icon + two lines — what it does ("take a pic"), why ("learn about a piece that speaks to you")

### 3.2 Camera Capture (Phase 1)
- Camera-first, full-screen viewfinder
- Per extensive testing: wide/cluttered shots with multiple pieces in frame are the least reliable case — a directly-tested multi-object photo never produced a trustworthy single answer under any configuration. The capture UI should visually nudge visitors to fill the frame with one piece — e.g. a soft framing guide or a short hint line ("Get close — fill the frame with one piece"). This isn't a nice-to-have: it's the single biggest lever the UI has over which of the three match-result tiers (Section 3.4) a visitor is likely to see.
- No manual browse/search entry point in-app (confirmed decision — Museum's own site search covers that need externally)

### 3.3 Result Screen (Phase 1 + Phase 2) — opens as a drawer/modal over Collection
Per your sketch, top to bottom:
- Photo — **the clean museum reference image** (confirmed decision), not the visitor's own shot
- Title / Creator(s) / Year — copy needs to handle multi-creator, role-qualified pieces honestly (see OOUX doc)
- Description (curatorial text)
- **Similar Works** — up to 3 cards, each tagged with why it's related (Same Creator / Same Room / Same Floor). Fixed priority: 1 slot max for Same Creator, then Same Room over Same Floor for remaining slots. Needs to render gracefully with as few as 1 card — El Jaleo, in the real pilot data, only ever produces exactly 1.
- Close (X) to dismiss back to Collection, or "New Pic" to go straight to another capture

### 3.4 Match Result States — three tiers, all overlay Camera (finalized August 10, 2026)

Superseding the earlier binary "confident match or retry" model. Real testing showed a third state matters: a meaningful share of "not confident" photos actually have the correct piece just short of the auto-match bar — sometimes as the system's actual best guess. Rather than force a wrong auto-answer or silently discard that signal, a middle tier lets the visitor resolve it themselves.

**Tier 1 — Confident Match**: unchanged from Section 3.3 — Result opens as a drawer over Collection.

**Tier 2 — "Did You Mean?" (new)**: up to 4 tappable candidate thumbnails, using the real clean reference images (not the visitor's own photo) so comparison is easy. Ranked highest-likelihood first. Copy should read like a genuine, respectful question, not an error state — something like "Which one is this?" rather than "We're not sure." Include a clear "None of these" escape hatch that routes to Tier 3's retry prompt. Tapping a candidate opens that piece's Result drawer exactly as Tier 1 would. **Important**: this list can be shorter than 4 — never pad it with weak guesses just to fill slots, since a low-signal option sitting next to real candidates undermines trust in the whole list. Accessibility note: each candidate needs a real text label (title, not just a thumbnail) for screen reader/switch control users, consistent with the Section 4 accessibility priority.

**Tier 3 — No Match**: the original fallback behavior, unchanged — plain, warm retry prompt, no candidate list (a list here would just be noise dressed up as options). Given no in-app manual search, this should probably also gently point to the Museum's site search as an alternative, rather than leaving the visitor stuck.

**A real edge case worth designing for deliberately**: a photo containing more than one recognizable piece (e.g. a wide shot catching two different paintings) can legitimately produce a Tier 2 candidate list rather than a clean Tier 1 match — this is graceful, correct behavior under this model, not a bug to route around. Reinforces why the Section 3.2 framing hint matters: it's not just about match accuracy, it's about how often a visitor sees Tier 2 at all versus a clean Tier 1 result.

### 3.5 Your Collection — the app's home/base screen (Phase 3 + Phase 4)
Per your sketches (2 & 3), refined:
- **Empty state** (new, not yet sketched): first-time visitors land here with nothing yet — needs simple, inviting copy prompting the first capture
- "Your Collection" header + **Email Me** action
- Grid of everything photographed this visit (+ ## more if it overflows)
- **Your Courtyard Plant, based on your collection** — playful tone per your answer, with its own illustration/visual treatment
- Real content hook available: the Museum's site already has a "Seasonal Courtyard Displays" page — worth Claude Code/Design treating this as a real (if simple) data source rather than invented content, even at pilot scale
- "New Pic" action, returning to Camera Capture

## 4. Tone & Content Notes
- **Plant tie-in**: playful, not scholarly. Frame as a fun bonus discovery, not a curatorial claim linking painting to plant.
- **Match result messaging, across all three tiers**: warm, not error-coded — this is a visitor's private moment with art, not a failed API call. Tier 2 ("Did You Mean?") especially needs to read as a genuine, respectful question the visitor is well-equipped to answer, not an apology for the system's uncertainty. Tier 3 (No Match) stays a plain, friendly retry prompt.
- **Accessibility**: per your CPACC background, this should be a first-class constraint, not an afterthought — sufficient contrast, focus states on all interactive elements, alt text on artwork images, real text labels (not just thumbnails) on Tier 2 candidates, and camera-capture flow needs to remain usable for visitors relying on screen readers or switch control even though the core interaction is visual/photographic.

## 5. Component Inventory (for Claude Design)
- Landing card (icon + heading + subtext)
- Camera viewfinder with framing guide/hint
- Drawer/modal container (for Result over Collection)
- Result content (photo + title/creator(s)/year + description block)
- Similar Works card (thumbnail + relation tag: Same Creator / Same Room / Same Floor) — must support a 1-, 2-, or 3-card row, not just the full state
- **"Did You Mean?" candidate picker (new)** — up to 4 tappable candidate cards (thumbnail + title), must support 1-4 candidates gracefully, plus a "None of these" action
- No Match state overlay (on Camera) — Tier 3, plain retry prompt
- Collection empty state
- Collection grid item (thumbnail)
- Courtyard plant reveal card
- Primary button ("New Pic," "Email Me")

## 6. Visual System — Use the Imported Claude Design System

Steph has already imported a design system into Claude Design based on gardnermuseum.org's real theme ("isgm17") — this is the source of truth, not the tokens below. **Claude Design should pull colors, typography, and component styles from that imported system directly**, not from a re-typed spec in this doc, so the two don't drift out of sync as either evolves.

For reference, the imported system is grounded in:
- **Typography**: "DTL Elzevir Webfont" (serif) for headings, "Futura PT Webfont" (sans) for body/UI — same pairing as the real site
- **Shape/interaction**: sharp corners (no rounding), outlined buttons that invert to filled on hover/focus, 4:3 card image ratio
- **Color**: real site neutrals, plus a finalized three-hue application (see below) drawn from the site's broader "section identifier" system

### Color — Finalized
- **Landing/Entry**: **indigo** — matches the real "While You're Here" page (confirmed)
- **In-app default** (Camera Capture, all three match-result tiers including the new "Did You Mean?" picker, Result drawer, Your Collection): **orange** — matches the real site's individual-work/collection pages
- **Courtyard Plant reveal**: **green** — a section *within* the Collection screen, not a separate screen — matches the real Seasonal Courtyard Displays page
- Deliberately non-repeating across a single visitor session (indigo → orange → green), avoiding the collision risk of reusing a hue within one short sitting, even though the real multi-page site reuses green in two places without issue at website scale

One thing worth double-checking once Claude Design generates the first screens: confirm the imported system's `.high-contrast` accessibility mode (present on the real site) carried over, since that's a meaningful accessibility asset worth reusing rather than rebuilding, per the Section 4 accessibility priority.

## 7. Open Questions
None remaining. All resolved: clean reference photo, Collection-as-home with Result-as-drawer, the full three-hue color system (indigo Landing → orange default → green Plant, Section 6), Similar Works tags stay neutral for now (no color-coding), and — new as of today — the three-tier match result model (Section 3.4) replacing the earlier binary confident/retry design.

This document is ready for Claude Design.
