import type { CandidateOut } from "../api/types";

interface CandidateCardProps {
  candidate: CandidateOut;
  onSelect: () => void;
}

/** "Did You Mean?" candidate (design brief Section 5 component inventory):
 * thumbnail + a REAL text label, per the Section 4 accessibility note -
 * never a bare image for screen reader / switch control users. Visual
 * treatment matches the Claude Design export's "Multiple Objects Found"
 * candidate grid. */
export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ height: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)" }}
    >
      <div
        style={{
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg)",
          borderRadius: "var(--radius-base)",
          background: "white",
          boxShadow: "var(--shadow-md)",
          color: "var(--color-text-primary)",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", margin: "calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) 16px", flexShrink: 0 }}>
          {candidate.image ? (
            <img
              src={candidate.image.url}
              alt={candidate.image.alt_text}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "var(--color-neutral-grey-light)" }} aria-hidden="true" />
          )}
        </div>
        <div style={{ fontSize: 12, color: "#77706e", marginBottom: 4 }}>{candidate.creator_display}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#121212", lineHeight: 1.3 }}>{candidate.title}</div>
        <div style={{ flex: "1 1 auto" }} />
      </div>
    </button>
  );
}
