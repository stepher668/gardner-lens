import type { CSSProperties, HTMLAttributes } from "react";

/** Reimplemented from the export's `_ds_bundle.js`
 * (components/surfaces/Card.jsx) - see Button.tsx for context. */

export type CardVariant = "default" | "elevated" | "accent";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const VARIANTS: Record<CardVariant, CSSProperties> = {
  default: { backgroundColor: "white", border: "var(--border-width-thin) solid var(--color-border-default)", color: "var(--color-text-primary)" },
  elevated: { backgroundColor: "white", boxShadow: "var(--shadow-md)", color: "var(--color-text-primary)" },
  accent: { backgroundColor: "var(--brand-dark)", color: "var(--btn-text)", border: "none" },
};

export function Card({ children, variant = "default", style, ...props }: CardProps) {
  const baseStyles: CSSProperties = {
    padding: "var(--space-lg)",
    borderRadius: "var(--radius-base)",
    transition: "var(--transition-sm)",
  };

  return (
    <div style={{ ...baseStyles, ...VARIANTS[variant], ...style }} {...props}>
      {children}
    </div>
  );
}
