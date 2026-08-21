import { useEffect, useState } from "react";

const KEY = "gardner-lens.high-contrast";

function readInitial(): boolean {
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

/** Design brief Section 6: "confirm the imported system's .high-contrast
 * accessibility mode carried over ... worth reusing rather than
 * rebuilding." This is the functional placeholder until that real
 * mechanism lands - see theme/tokens.css for the [data-high-contrast]
 * rules it toggles. */
export function HighContrastToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => readInitial());

  useEffect(() => {
    document.documentElement.setAttribute("data-high-contrast", String(enabled));
    try {
      localStorage.setItem(KEY, String(enabled));
    } catch {
      // ignore
    }
  }, [enabled]);

  return (
    <button
      type="button"
      className="btn btn-secondary high-contrast-toggle"
      aria-pressed={enabled}
      onClick={() => setEnabled((v) => !v)}
    >
      {enabled ? "High contrast: on" : "High contrast: off"}
    </button>
  );
}
