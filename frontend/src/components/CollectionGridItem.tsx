import type { CollectionItemOut } from "../api/types";

interface CollectionGridItemProps {
  item: CollectionItemOut;
  onSelect: () => void;
}

/** Matches the Claude Design export's Collection grid card exactly
 * (4:3 image, title only - no creator line, unlike the candidate cards).
 * Tapping it reopens that piece's Result drawer, same as the export's
 * `art.openMe`. */
export function CollectionGridItem({ item, onSelect }: CollectionGridItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        style={{ height: "100%", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)" }}
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
          <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", margin: "calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) 16px", flexShrink: 0 }}>
            {item.image ? (
              <img
                src={item.image.url}
                alt={item.image.alt_text}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "var(--color-neutral-grey-light)" }} aria-hidden="true" />
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>{item.title}</div>
          <div style={{ flex: "1 1 auto" }} />
        </div>
      </button>
    </li>
  );
}
