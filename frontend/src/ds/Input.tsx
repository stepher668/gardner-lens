import type { CSSProperties, InputHTMLAttributes } from "react";

/** Reimplemented from the export's `_ds_bundle.js`
 * (components/forms/Input.jsx) - see Button.tsx for context. Not used by
 * any Phase 1 screen yet (no text entry in this pass), ported for
 * completeness since it's part of the design system's component set. */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ type = "text", disabled = false, error = false, style, ...props }: InputProps) {
  const baseStyles: CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "1.5px",
    padding: "8px 12px",
    minHeight: "40px",
    border: "1px solid white",
    borderRadius: "0",
    backgroundColor: "var(--color-accent)",
    color: "white",
    width: "100%",
    boxSizing: "border-box",
    transition: "var(--transition-sm)",
  };

  const errorStyles: CSSProperties = error ? { borderColor: "var(--color-error)", backgroundColor: "var(--color-error)" } : {};

  return (
    <input
      type={type}
      disabled={disabled}
      style={{ ...baseStyles, ...errorStyles, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "text", ...style }}
      {...props}
    />
  );
}
