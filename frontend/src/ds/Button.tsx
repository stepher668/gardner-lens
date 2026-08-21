import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";

/**
 * Button - reimplemented from the Claude Design export's
 * `_ds_bundle.js` (components/buttons/Button.jsx), translated to
 * TypeScript since that bundle targets Claude Design's canvas runtime
 * (a `window.<namespace>.Button` global), not a normal module import.
 * Variant/size/style logic is copied 1:1, including the hover state.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, { default: CSSProperties; hover: CSSProperties }> = {
  primary: {
    default: { backgroundColor: "var(--btn-bg)", color: "var(--btn-text)", borderColor: "var(--btn-border)" },
    hover: { backgroundColor: "var(--btn-bg-hfa)", borderColor: "var(--btn-border-hfa)", color: "var(--btn-text-hfa)" },
  },
  secondary: {
    default: {
      backgroundColor: "var(--color-neutral-grey-light)",
      color: "var(--color-brand-green-dark)",
      borderColor: "var(--color-brand-green-dark)",
      border: "1px solid",
      padding: "calc(var(--space-sm) + 1px) calc(var(--space-md) + 1px)",
    },
    hover: {
      backgroundColor: "white",
      color: "var(--color-brand-green-dark)",
      borderColor: "var(--color-brand-green-dark)",
      border: "2px solid",
      padding: "calc(var(--space-sm) - 1px) calc(var(--space-md) - 1px)",
    },
  },
  ghost: {
    default: { backgroundColor: "transparent", color: "var(--brand-dark)", borderColor: "transparent", textDecoration: "underline" },
    hover: { backgroundColor: "transparent", color: "var(--brand-dark)" },
  },
};

function fontSize(size: ButtonSize): string {
  return size === "sm" ? "13px" : size === "lg" ? "18px" : size === "xl" ? "32px" : "15px";
}

function padding(size: ButtonSize): string {
  return size === "sm"
    ? "var(--space-sm) var(--space-md)"
    : size === "lg"
      ? "var(--space-md) var(--space-lg)"
      : size === "xl"
        ? "var(--space-lg) var(--space-xl)"
        : "var(--space-sm) var(--space-md)";
}

export function Button({ children, variant = "primary", disabled = false, size = "md", style, ...props }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles: CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: fontSize(size),
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    border: "2px solid",
    borderRadius: "0",
    padding: padding(size),
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "var(--transition-sm)",
    minHeight: size === "xl" ? "64px" : "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const variantStyle = isHovered ? VARIANTS[variant].hover : VARIANTS[variant].default;

  return (
    <button
      style={{ ...baseStyles, ...variantStyle, opacity: disabled ? 0.6 : 1, ...style }}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
}
