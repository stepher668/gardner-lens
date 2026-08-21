# PRD: Gardner Lens
### Visual artwork identification for the Isabella Stewart Gardner Museum
**Status:** Draft v1 · **Owner (PM):** Claude (working session) · **Product Designer:** Steph Ronan · **Date:** August 10, 2026

---

## 1. Problem Statement

Per Isabella Stewart Gardner's will, artwork in the Museum's permanent collection is displayed without labels — visitors experience the collection as she arranged it, not as a curated, annotated tour. This is core to the Museum's identity and is not something this product should try to change.

However, visitors with smartphones (and the Museum's free wifi, for those without cell data) have an opt-in way to get information *if they seek it out*, without the Museum adding a single label to a wall. A visitor can photograph a piece and receive the same information a label would have given them — on their own device, on their own initiative.

**This is not a replacement for the unlabeled-gallery experience. It's an opt-in layer for visitors who want more.**

## 2. Goals & Success Metrics

| Goal | Metric (proposed) |
|---|---|
| Visitors can identify artwork without disrupting the unlabeled gallery experience | # of successful identifications per session |
| Recognition is fast and accurate enough to feel "magic," not frustrating | Recognition accuracy rate; time-to-result |
| Visitors engage more deeply with the collection | Avg. # of pieces photographed per visit; return visits to the mobile site |
| Museum can eventually adopt this without curatorial/legal friction | Clean rights story; no docent/label conflicts reported |

*Open question for you: does the Museum have any existing visitor engagement metrics (dwell time, repeat visits) that this should be benchmarked against?*

## 3. Users

**Primary:** Museum visitors with a smartphone, self-directed, wanting more context on a specific piece they're standing in front of.

**Secondary (later):** Museum staff/docents (for phase 3+ analytics on what's popular), Museum marketing (courtyard/plant tie-in as a seasonal/social hook).

**Explicitly not the audience:** Visitors who want a guided tour experience — that's a different product (audio guide, docent tour).

## 4. Constraints & Principles

- **Never put a label on the wall.** All info surfaces only on the visitor's own device, only when they seek it.
- **Wifi-only assumption is safe** — Museum already provides wifi for visitors without cell data, so the product should be designed to work well on that network (not overly bandwidth-heavy, e.g. avoid uploading full-res images if a compressed version suffices).
- **Rights & licensing (critical, real-MVP concern):** The Gardner's collection has a mix of public-domain and rights-managed works. Before pulling real images/descriptions at scale:
  - Confirm which pieces are public domain vs. rights-managed (Museum's collections API/site may already flag this).
  - For MVP/demo purposes, scope to a small set of public-domain, unambiguously fine-to-use pieces.
  - Flag clearly in docs that a real pitch to the Museum would need their explicit sign-off on data usage, not just "the info exists on their public website."
- **Accessibility:** Since this is meant as a real MVP candidate, build with WCAG 2.1 AA in mind from the start — camera-based interaction needs a non-visual/non-camera fallback (e.g., manual search or browse-by-room) for visitors who can't or don't want to use the camera flow.

## 5. Phases (as scoped by Steph)

### Phase 1 — Core identification
Visitor takes a picture of a piece → app returns the Museum's page/info about that piece.

**Requires:**
- Camera capture flow (mobile web, browser camera API)
- Image recognition: match photo → known artwork
- Display of artwork detail (image, title, creator(s), date, materials, room location, curatorial description) — per the OOUX model, "creator(s)" can be plural and role-qualified (e.g. author/publisher/subject on a single piece), so the result screen's copy needs to handle multi-creator display honestly, not assume one name per piece
- Fallback path for failed/ambiguous matches (e.g. "we're not sure — did you mean...?" with visual candidates, or manual search)

**Recognition approach — real API, per your answer.** Two realistic sub-options, worth deciding before build:
1. **General-purpose vision API** (e.g. Google Cloud Vision, AWS Rekognition) + custom matching logic against your reference image set. Fast to stand up, but general-purpose APIs aren't tuned for fine art and may confuse similar pieces (e.g. two Titians).
2. **Custom similarity model** (e.g. embeddings via CLIP or similar, compared against a reference embedding for each known piece). More setup work, but much better suited to "match this photo to one of ~2,500 specific artworks" than a general object-detector.

*My recommendation: start with option 2 (embedding similarity search) even for the MVP — it's the actually-correct tool for this problem and isn't much harder to prototype than wiring up a generic vision API, given Claude Code can scaffold it.* Worth a quick technical spike before locking this in.

### Phase 2 — Discovery
Adds: a **"Similar Works" section directly on the result screen** — capped at 3 cards, each tagged with why it's related (Same Creator / Same Room / Same Floor). Finalized after two revisions during the OOUX/CTA exercise (see `gardner-lens-ooux-model.md`): started as two inline sketch sections → became a single CTA leading to a separate screen → landed here, closer to the original sketch but with per-card tags and a hard cap so it never overwhelms.

**Requires:**
- Selection rule (pilot, fixed priority, not a scoring model): fill up to 1 slot with Same Creator, then prioritize Same Room over Same Floor for the remaining slots, up to 3 total
- Both "Same Room" and "Same Floor" reuse the Room→Floor hierarchy already in the data model — no new relationship needed
- Both sections reuse data already required for Phase 1 (no new recognition work) — this is presentation/query logic, not new matching capability
- **Explicitly reserved, not built**: Category, Era, and Region as future tag types on the same section. The Category object already exists in the data model (see OOUX doc) but has no CTA yet — this is intentional, not a gap.
- **Data check needed before the reference-photo shoot**: confirm the 6 pilot pieces have real Same Room / Same Floor overlap with each other, not just the one confirmed Same Creator pairing (El Jaleo and ISG Portrait are both John Singer Sargent) — otherwise the demo could come up empty on 2 of 3 tag types
- **Noted for later, not now**: a real weighted-scoring model (e.g. Creator + Floor outranking a plain Same Room match) is a plausible v2 — flagged so the pilot's fixed priority order isn't mistaken for a permanent design decision

### Phase 3 — Take-home list
Adds: visitor can email themselves a list, with links, of everything they've photographed this visit.

**Requires:**
- Session-based history of photographed pieces (no login — should work anonymously per visit)
- Email capture + send (transactional email service)
- Museum-hosted or app-hosted permalink per piece for the email links

### Phase 4 — Courtyard plant tie-in
Adds: after 3 photos, visitor sees a courtyard plant connected to the artwork they've photographed.

**Requires:**
- A mapping between artwork (subject matter, period, origin, palette, etc.) and courtyard plants — this is a curatorial/content task as much as a technical one
- Design for how this is framed (a fun bonus vs. a serious curatorial claim) — worth a conversation with you on tone, since this is the most "delight feature" of the four phases

## 6. Out of Scope (for now)
- Docent/staff-facing tools
- Multi-language support (flag if this should move up — Museum likely has international visitors)
- Offline/no-wifi mode
- Native app
- Provenance/former-ownership history (decided during OOUX exercise — real part of the collection domain, deliberately deferred)
- Special/temporary exhibitions (decided during OOUX exercise — these typically already have labels, unlike the permanent collection under the will, and sit outside this app's premise)

## 7. Open Questions — Answered (July 22, 2026)
1. **Image rights/API access contact**: Not pursued yet — contingent on the MVP proving itself first. *This confirms the build order: working prototype → validate technically → then pursue Museum conversation.*
2. **Camera-first is fine for MVP.** No manual browse/search needed in-app; the Museum's existing site search covers that (even if imperfectly) as a fallback outside the app.
3. **Plant tie-in tone: playful.** A delight feature, not a curatorial claim — should be designed and written that way (e.g. "the courtyard has this in bloom right now" rather than implying a scholarly link between painting and plant).
4. **No vendor/budget constraint** on the recognition approach.

## 8. Competitive Context — Smartify

The Museum is separately evaluating **Smartify**, a third-party app that does artwork recognition, for the same Phase 1 problem this PRD addresses. This matters for scope and positioning:

- Smartify is a general-purpose, multi-museum platform — it's not built specifically around the Gardner's no-labels philosophy, its collection quirks, or its volunteer/curatorial knowledge.
- Steph's edge as both a volunteer with deep institutional familiarity and a product designer is knowing what a Gardner-specific tool *should* feel like — e.g. respecting the will's spirit (opt-in, unobtrusive), the courtyard/plant connection (Phase 4), and a take-home list (Phase 3) tuned to how Gardner visitors actually engage.
- **Implication for scope**: Phase 1 alone (bare recognition) is the least differentiated part of this product relative to Smartify — it's necessary infrastructure, not the pitch. Phases 2–4 are where the differentiation lives. Worth designing Phase 1's UI so it's clearly extensible toward those phases, even before they're built, so early demos (to the Museum or otherwise) show the fuller vision, not just "another Smartify."
- Open strategic question: is the goal to compete with/replace a Smartify adoption, complement it, or use this project's existence to influence what the Museum asks for *if* they do go with a vendor like Smartify? Worth deciding before a Museum pitch, though not before building.

**Validated competitive claim (July 24, 2026): minimal source imagery required.** The Museum has indicated Smartify would require substantial *additional* source photography for good results — a real barrier given the collection's scale (~18,000+ objects), and a genuine deterrent to adoption. Direct testing (Section 9, Section 12) shows Gardner Lens achieves zero false positives across the full 7-piece pilot using **only the professional photography the Museum already has** — 1–3 existing photos per piece, no dedicated shoot. This is no longer a hoped-for advantage; it's a measured result, and it directly targets the specific friction point the Museum has already raised about the alternative.

## 9. Recognition Approach — Validated by Technical Spike (Updated August 10, 2026)

Extensive hands-on testing (ten-plus rounds, culminating in a full 7-piece test with a clean professional/visitor photo split, plus targeted stress tests on single-image references and multi-object photos) replaced the project's early assumptions with real evidence. Key findings, now final:

- **Approach**: local-feature matching (ORB) with ratio test + geometric verification (RANSAC), not a general-purpose cloud vision API and not embedding similarity alone. No GPU required.
- **Three-tier confidence model, not a binary match/no-match.** A meaningful share of "low confidence" cases have the correct piece just below the auto-match bar — sometimes as the algorithm's actual top guess. Rather than discard that signal, or auto-commit to it (both wrong), a middle tier lets a visitor resolve it themselves:
  - **Confident Match** (auto-display result) — the existing, most rigorously validated threshold
  - **"Did You Mean?" candidate list** (up to 4 tappable options, visitor picks theirs) — a new tier, validated against held-out data; full mechanics and the specific score threshold are in the technical architecture doc
  - **No Match** (plain retry prompt) — for cases with no real signal at all, not dressed up as a false choice
- **Data requirement — revised, lower-effort than originally planned**: the earlier assumption that each piece needed a dedicated volunteer photo shoot (3–5 new angles) has been superseded. **Testing showed that the Museum's existing professional photography — as few as 1–3 photos per piece, already on hand — achieves zero false positives across the full 7-piece pilot set.** See Section 12 for the full validated numbers and what this means competitively.
- **Synthetic image augmentation was tested and explicitly rejected.** Multiple configurations (lighting-only, combined angle+lighting, tested at both single-image and multi-image reference scale) were tried as a way to close coverage gaps without new photos. Every one traded away the zero-false-positive guarantee for modest coverage gains — not an acceptable trade for a museum context where a visitor seeing a confidently wrong answer matters more than an occasional "please retry."
- **A single reference photo per piece works, but coverage drops sharply.** Tested directly: with only 1 clean photo per piece, 5 of 7 pieces got zero confident matches at all (never wrong, just far more cautious). Reinforces that photo *count*, not photo framing, is the main lever — see technical architecture doc for the full comparison.
- **Weak spot identified**: wide/cluttered shots (multiple pieces in one frame) are meaningfully less reliable. Worth the capture UI nudging visitors to fill the frame with one piece. A directly-tested multi-object photo (containing two real, different pieces) never produced a trustworthy single answer under any configuration — the new "Did You Mean?" tier is a more honest way to handle this case than forcing a single guess.
- **Scale plan**: a two-stage hybrid (cheap shortlist filter → expensive verification only on shortlisted candidates) is architecturally sound and preserved accuracy in testing, but the shortlist filter itself needs to be smarter than simple color-histogram matching before trusting it at full collection scale (~2,500 pieces) — flagged as a pre-launch validation task, not a Phase 1 blocker for a small pilot set. An open-source embedding model (CLIP/DINOv2) is a plausible candidate for that shortlist filter, deferred to the Claude Code build phase (full test spec in the technical architecture doc) — see Section 12.

## 10. Open Questions — Answered (July 22, 2026)
1. **Pilot scope: 7 pieces** (expanded from the original 6 once real collection data was gathered): El Jaleo, Europa, The Dormition and Assumption of the Virgin, The Presentation of the Christ Child in the Temple, Portrait of Isabella Stewart Gardner, Isabella Stewart Gardner in Venice, Self Portrait Age 23.

   | Artwork | Creator | Room | Floor |
   |---|---|---|---|
   | El Jaleo | John Singer Sargent | Spanish Cloister | 1st |
   | Europa | Titian | Titian Room | 3rd |
   | The Dormition and Assumption of the Virgin | Fra Angelico | Early Italian Room | 2nd |
   | The Presentation of the Christ Child in the Temple | Giotto | Gothic Room | 3rd |
   | Portrait of Isabella Stewart Gardner | John Singer Sargent | Gothic Room | 3rd |
   | Isabella Stewart Gardner in Venice | Anders Zorn | Short Gallery | 2nd |
   | Self Portrait, Age 23 | Rembrandt Van Rijn | Dutch Room | 2nd |

   **Similar Works coverage confirmed against this real data** (using the Section 5 priority rule): every piece returns at least 1 card, none come up empty. **"Portrait of Isabella Stewart Gardner" is the one piece where all three tiers apply at once** (Same Creator: El Jaleo · Same Room: The Presentation · Same Floor: Europa) — the natural demo piece for showing the priority rule actually working. **El Jaleo is the opposite edge case**: alone on the 1st floor, so its only Similar Works card is the Same Creator match — worth confirming the design brief's card layout handles a 1-card result gracefully, not just the full 3-card case.

   **Photo gap — resolved.** All 7 pieces now have both real professional reference photos and genuine held-out visitor-style test photos (see Section 12 for the full validated results). The two pieces needing additional real angles for better coverage — not missing entirely, just thin — are Isabella Stewart Gardner (Sargent) and Self Portrait, Age 23 (Rembrandt), per Section 9.
2. **Reference photos: superseded — no dedicated volunteer shoot required.** This was the plan before testing; Section 9/12 supersede it. The Museum's existing professional photography (1–3 photos per piece) is sufficient, validated with zero false positives across all 7 pilot pieces. The only remaining photo need is narrow and optional: Isabella Stewart Gardner (Sargent portrait) and Self Portrait, Age 23 (Rembrandt) currently get zero *confident* matches (never wrong, just cautious) — 1–2 additional real angles for those two specifically, if convenient to obtain, would close that gap. Not a blocker to the pilot as-is.
3. **Smartify positioning: lean in.** Phases 2–4 should be visibly previewed even in the early build/demo — not just Phase 1 recognition — so the differentiation from a generic tool like Smartify is legible from the start, not saved for a later pitch.

## 11. Design Brief — Revised and Reconciled (July 23, 2026)

Done. The design brief now reflects the final "Similar Works" model (Section 5, Phase 2 above), the real 7-piece pilot dataset, and real visual tokens pulled from the Museum's actual public theme CSS. It also resolves a navigation question that had been left open mid-conversation: **"Your Collection" is now the app's home/base screen**, with each artwork Result opening as a drawer/modal on top of it — which also retired the earlier unresolved "how does a visitor get back to Collection" question by making it structural rather than a bolted-on nav element.

## 12. Validated Recognition Results (July 24, 2026)

Full numbers behind the claims in Sections 9 and the Smartify positioning above, tested against the complete 7-piece pilot set with a clean split: real professional Museum photos as reference (1–3 per piece, no new photography), genuine visitor-style photos as held-out test queries.

| Configuration | Confident & correct | Wrong confident | Low-confidence |
|---|---|---|---|
| **Real photos only (adopted)** | 6/6 (100%) | **0** | 8/14 (57%) |
| + lighting-only synthetic augmentation | 9/10 (90%) | 1 | 4/14 |
| + angle+lighting synthetic augmentation | 8/10 (80%) | **2** | 4/14 |

**Headline result**: zero false positives, using only existing Museum photography. **Honest cost**: 57% of harder real visitor photos land in "low confidence — try again" rather than an instant match. Two pieces (Isabella Stewart Gardner by Sargent, Self Portrait by Rembrandt) got zero confident matches at all with their current photo counts — never wrong, just cautious — and would most benefit from 1–2 additional real angles if convenient to obtain.

**Synthetic augmentation was tested and rejected as a fix for the coverage gap** — every configuration that used it introduced at least one confidently wrong answer, which matters more for visitor trust than the coverage it bought. See technical architecture doc Section 2 for the full methodology and a visual comparison of what these augmentations actually produce.

**Deferred, not abandoned**: open-source embedding models (CLIP/DINOv2) may be able to close the coverage gap without synthetic augmentation's downside, using the same minimal photo set. Blocked in this exploratory environment by sandbox network restrictions, not by feasibility — full test spec is in the technical architecture doc, ready to run early in the Claude Code build.

## 13. Next Documentation
Now unblocked. Recommended next artifacts, in order:
- **(Optional, narrow) additional angles for 2 pieces** — not a full shoot, just Isabella Stewart Gardner (Sargent) and Self Portrait (Rembrandt) specifically, per Section 12, if convenient
- **Technical architecture doc** — for Claude Code: stack choice, matching pipeline (Section 9, and technical doc Section 2 for full validated results + the deferred embedding test spec), data schema, API structure, and how the app surfaces Phase 2–4 previews even before those phases are fully functional
- **Design brief** — for Claude Design: screen flows for Phase 1 (capture → match → **three-tier result**: confident match / "Did You Mean?" candidate picker / no-match retry), tying into the existing nature/watercolor visual system, with explicit treatment of how Phases 2–4 get teased in the UI
