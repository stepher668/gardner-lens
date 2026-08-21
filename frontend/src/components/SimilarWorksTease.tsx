/** Design brief Section 3.3 / PRD Phase 2. Per this build's scope, Similar
 * Works is a visual tease only - it doesn't call `/artwork/:id/similar`
 * (that endpoint doesn't exist yet). Rendered here so the fuller vision is
 * legible in the UI now, per PRD Section 8's "lean in against Smartify"
 * positioning, without pretending the feature is functional. */
export function SimilarWorksTease() {
  return (
    <section className="similar-works-tease" aria-label="Similar works">
      <h3>Similar Works</h3>
      <p className="tease-note">Coming soon - pieces by the same creator, or nearby in the galleries.</p>
    </section>
  );
}
