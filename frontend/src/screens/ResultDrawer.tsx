import { useEffect, useRef } from "react";
import { Button } from "../components/Button";
import { SimilarWorksTease } from "../components/SimilarWorksTease";
import type { ArtworkDetailOut } from "../api/types";

interface ResultDrawerProps {
  artwork: ArtworkDetailOut;
  onClose: () => void;
  onNewPic: () => void;
}

/** Design brief Section 3.3: opens as a drawer/modal over Collection.
 * Photo (clean museum reference image, not the visitor's shot) / Title,
 * Creator(s), Year / description / Similar Works tease / Close or New Pic. */
export function ResultDrawer({ artwork, onClose, onNewPic }: ResultDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="drawer-backdrop">
      <div
        className="theme-orange drawer result-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <button ref={closeButtonRef} type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {artwork.image ? (
          <img className="card-image result-image" src={artwork.image.url} alt={artwork.image.alt_text} />
        ) : (
          <div className="card-image result-image card-image-placeholder" aria-hidden="true" />
        )}

        <h2 id="result-title">{artwork.title}</h2>
        <p className="result-byline">
          {artwork.creator_display} &middot; {artwork.date_display}
        </p>
        <p className="result-location">
          {artwork.room_name}, {artwork.floor_name}
        </p>
        <p className="result-description">{artwork.description}</p>

        <SimilarWorksTease />

        <div className="drawer-actions">
          <Button onClick={onNewPic}>New Pic</Button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Back to Collection
          </button>
        </div>
      </div>
    </div>
  );
}
