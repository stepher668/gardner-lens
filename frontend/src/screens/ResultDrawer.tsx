import { useEffect, useRef } from "react";
import { IconTextButton } from "../ds";
import { formatCreatorBioLine } from "../utils/creatorBio";
import type { ArtworkDetailOut } from "../api/types";

interface ResultDrawerProps {
  artwork: ArtworkDetailOut;
  onClose: () => void;
  onNewPic: () => void;
}

const CameraIconSmall = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(180deg)", verticalAlign: "-3px" }}>
    <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M9 21h6" />
  </svg>
);

const SIMILAR_WORKS_TEASE = [
  { tag: "Same Room", color: "var(--color-brand-indigo-dark)", title: "More like this" },
  { tag: "Same Floor", color: "var(--color-brand-green-dark)", title: "More like this" },
  { tag: "Same Creator", color: "var(--color-brand-red-dark)", title: "More like this" },
];

/** Design brief Section 3.3: opens as a drawer/modal over Collection.
 * Photo (clean museum reference image, not the visitor's shot) / Title,
 * Creator(s), Year / description / Similar Works tease / New Picture.
 * Visual treatment matches the Claude Design export's Object Details
 * screen exactly, including the floor(green)/room(indigo) badges and the
 * color-coded Similar Works tags (per user direction 2026-08-21, following
 * the export over the design brief's earlier "neutral tags" note). */
export function ResultDrawer({ artwork, onClose, onNewPic }: ResultDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const primaryCreator = artwork.creators[0];
  const bioLine = formatCreatorBioLine(primaryCreator);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="theme-orange"
        style={{ position: "fixed", top: 10, left: 10, right: 10, bottom: 10 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <div
          style={{
            background: "var(--color-background-surface)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-border-default)",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              maxHeight: 600,
              flexShrink: 0,
              background: "linear-gradient(to bottom, var(--color-neutral-grey-light), var(--color-neutral-white))",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {artwork.image ? (
              <img
                src={artwork.image.url}
                alt={artwork.image.alt_text}
                style={{ maxWidth: "100%", maxHeight: 600, width: "auto", height: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
              />
            ) : (
              <div style={{ width: "100%", aspectRatio: "4/3", background: "var(--color-neutral-grey-light)" }} aria-hidden="true" />
            )}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, background: "#121212", border: "none", color: "#fff", fontSize: 16, lineHeight: 1, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: "20px 24px 28px", flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ background: "var(--color-brand-green-dark)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 2 }}>
                {artwork.floor_name}
              </span>
              <span style={{ background: "var(--color-brand-indigo-dark)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 2 }}>
                {artwork.room_name}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#121212", marginBottom: 6 }}>
              {artwork.creator_display}
            </div>
            <h1
              id="result-title"
              style={{ fontFamily: "var(--font-sans)", fontSize: "var(--font-size-2xl)", lineHeight: 1.2, letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 6px", color: "#121212" }}
            >
              {artwork.title}
            </h1>
            <div style={{ fontFamily: "var(--font-serif-display)", fontSize: 16, letterSpacing: "1px", color: "#121212", marginBottom: 10 }}>{artwork.date_display}</div>
            {bioLine && <div style={{ fontFamily: "var(--font-serif-display)", fontStyle: "italic", fontSize: 14, color: "#464140", marginBottom: 2 }}>{bioLine}</div>}
            {artwork.medium && <div style={{ fontFamily: "var(--font-serif-display)", fontStyle: "italic", fontSize: 14, color: "#464140", marginBottom: 16 }}>{artwork.medium}</div>}

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border-default)", margin: "0 0 16px" }} />
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--color-text-primary)", margin: 0 }}>{artwork.description}</p>
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border-default)", margin: "24px 0 16px" }} />

            <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: 19, margin: "0 0 14px", color: "#121212" }}>Similar Objects</h2>
            <p className="visually-hidden">Coming in a future update - not yet available for this piece.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }} aria-hidden="true">
              {SIMILAR_WORKS_TEASE.map((item) => (
                <div
                  key={item.tag}
                  style={{ background: "white", border: "var(--border-width-thin) solid var(--color-border-default)", borderRadius: "var(--radius-base)", padding: "var(--space-sm)", boxSizing: "border-box", overflow: "hidden" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "calc(100% + 2 * var(--space-sm))",
                      margin: "calc(-1 * var(--space-sm)) calc(-1 * var(--space-sm)) 0",
                      textAlign: "center",
                      background: item.color,
                      color: "var(--color-neutral-white)",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 8px",
                      boxSizing: "border-box",
                    }}
                  >
                    {item.tag}
                  </span>
                  <div style={{ aspectRatio: "16/9", background: "var(--color-neutral-grey-light)", margin: "0 calc(-1 * var(--space-sm)) var(--space-sm)" }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>{item.title}</div>
                </div>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border-default)", margin: "0 0 16px" }} />
            <div className="theme-green" style={{ display: "flex", flexDirection: "column" }}>
              <IconTextButton variant="primary" size="md" icon={<CameraIconSmall />} onClick={onNewPic} style={{ width: "100%", height: 48 }}>
                New Picture
              </IconTextButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
