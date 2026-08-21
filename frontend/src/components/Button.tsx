import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/** The "Primary button" from the design brief's component inventory
 * (Section 5) - outlined, inverts to filled on hover/focus (Section 6). */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "secondary" ? "btn btn-secondary" : "btn";
  return <button className={`${variantClass} ${className}`.trim()} {...props} />;
}
