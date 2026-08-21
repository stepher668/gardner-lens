import type { CandidateOut } from "../api/types";

interface CandidateCardProps {
  candidate: CandidateOut;
  onSelect: () => void;
}

/** "Did You Mean?" candidate (design brief Section 5 component inventory):
 * thumbnail + a REAL text label, per the Section 4 accessibility note -
 * never a bare image for screen reader / switch control users. */
export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  return (
    <button type="button" className="candidate-card" onClick={onSelect}>
      {candidate.image ? (
        <img className="card-image" src={candidate.image.url} alt={candidate.image.alt_text} />
      ) : (
        <div className="card-image card-image-placeholder" aria-hidden="true" />
      )}
      <span className="candidate-card-title">{candidate.title}</span>
      <span className="candidate-card-creator">{candidate.creator_display}</span>
    </button>
  );
}
