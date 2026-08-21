/** PRD Phase 4 / design brief Section 3.5. A section within the Collection
 * screen (green accent, Section 6), not a separate screen. Per this
 * build's scope it's a visual tease, not the real algorithm (Tech Arch
 * Section 5) - but it respects the real trigger condition ("only surfaced
 * after 3+ pieces photographed", Tech Arch Section 5.2) rather than
 * showing unconditionally. */
export function PlantRevealTease({ itemCount }: { itemCount: number }) {
  if (itemCount < 3) return null;

  return (
    <section className="theme-green plant-reveal-tease" aria-label="Courtyard plant">
      <h3>Your Courtyard Plant</h3>
      <p className="tease-note">
        Based on your collection so far - coming soon. Check back after a few more pieces.
      </p>
    </section>
  );
}
