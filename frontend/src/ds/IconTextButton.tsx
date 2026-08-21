import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

/** Reimplemented from the export's `_ds_bundle.js`
 * (components/buttons/IconTextButton.jsx) - see Button.tsx for context. */

export type IconTextButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type IconTextButtonSize = "sm" | "md" | "lg" | "xl";

interface IconTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: IconTextButtonVariant;
  size?: IconTextButtonSize;
  iconOnly?: boolean;
  rounded?: boolean;
}

const VARIANTS: Record<IconTextButtonVariant, { default: CSSProperties; hover: CSSProperties }> = {
  primary: {
    default: { backgroundColor: "var(--btn-bg)", borderColor: "var(--btn-border)", color: "var(--btn-text)" },
    hover: { backgroundColor: "var(--btn-bg-hfa)", borderColor: "var(--btn-border-hfa)", color: "var(--btn-text-hfa)" },
  },
  secondary: {
    default: {
      backgroundColor: "var(--color-neutral-grey-lightest)",
      borderColor: "var(--color-brand-green-dark)",
      color: "var(--color-brand-green-dark)",
      border: "1px solid",
      padding: "calc(var(--space-sm) + 1px) calc(var(--space-md) + 1px)",
    },
    hover: {
      backgroundColor: "white",
      borderColor: "var(--color-brand-green-dark)",
      color: "var(--color-brand-green-dark)",
      border: "2px solid",
      padding: "calc(var(--space-sm) - 1px) calc(var(--space-md) - 1px)",
    },
  },
  ghost: {
    default: { backgroundColor: "transparent", borderColor: "transparent", color: "var(--color-text-primary)" },
    hover: { backgroundColor: "var(--color-neutral-grey-lightest)", borderColor: "transparent", color: "var(--color-text-primary)" },
  },
  dark: {
    default: { backgroundColor: "#121212", borderColor: "#121212", color: "#ffffff" },
    hover: { backgroundColor: "#ffffff", borderColor: "#121212", color: "#121212" },
  },
};

function fontSize(size: IconTextButtonSize): string {
  return size === "sm" ? "13px" : size === "lg" ? "18px" : size === "xl" ? "32px" : "15px";
}

function padding(size: IconTextButtonSize): string {
  return size === "sm"
    ? "var(--space-sm) var(--space-md)"
    : size === "lg"
      ? "var(--space-md) var(--space-lg)"
      : size === "xl"
        ? "var(--space-lg) var(--space-xl)"
        : "var(--space-sm) var(--space-md)";
}

export function IconTextButton({
  children,
  icon,
  variant = "primary",
  disabled = false,
  size = "md",
  iconOnly = false,
  rounded = false,
  style,
  ...props
}: IconTextButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles: CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: fontSize(size),
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    border: "2px solid",
    borderRadius: rounded && iconOnly ? "50%" : "0",
    padding: !iconOnly ? padding(size) : "0",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "var(--transition-sm)",
    height: iconOnly ? (size === "xl" ? "64px" : "40px") : "auto",
    width: iconOnly ? (size === "xl" ? "64px" : "40px") : "auto",
    minHeight: size === "xl" ? "64px" : "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
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
      {icon && (
        <span style={{ display: "inline-flex", alignItems: "center", fontSize: size === "xl" ? "32px" : "inherit" }}>{icon}</span>
      )}
      {!iconOnly && children}
    </button>
  );
}
