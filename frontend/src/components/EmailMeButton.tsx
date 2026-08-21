/** PRD Phase 3. Per this build's scope, rendered but inert - present in
 * the UI (PRD Section 8's "lean in" positioning) without pretending
 * sending is implemented yet. `aria-disabled` (not `disabled`) keeps it
 * discoverable to screen readers as a real, if not-yet-active, feature
 * rather than hiding it from the accessibility tree entirely. */
export function EmailMeButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-disabled="true"
      title="Coming soon"
      onClick={(e) => e.preventDefault()}
    >
      Email Me (coming soon)
    </button>
  );
}
