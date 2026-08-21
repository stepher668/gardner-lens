import { IconTextButton, Button } from "../ds";
import { CollectionGridItem } from "../components/CollectionGridItem";
import type { CollectionOut } from "../api/types";

interface CollectionProps {
  collection: CollectionOut | null;
  onNewPic: () => void;
  onResetSession: () => void;
  onSelectItem: (artworkId: string) => void;
}

const CameraIconSmall = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(180deg)", verticalAlign: "-3px" }}>
    <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M9 21h6" />
  </svg>
);

/** Design brief Section 3.5 / Section 2: the app's home/base screen -
 * empty at first, filling in as the visit continues. Result drawers open
 * on top of this screen and dismiss back to it (App.tsx owns that).
 * Visual treatment matches the Claude Design export's Collection screen. */
export function Collection({ collection, onNewPic, onResetSession, onSelectItem }: CollectionProps) {
  const items = collection?.items ?? [];
  const count = items.length;
  const hasCollection = count > 0;
  const courtyardUnlocked = count >= 3;

  const subtext = hasCollection ? `${count} ${count === 1 ? "piece" : "pieces"} photographed this visit` : "Nothing yet — your photographed pieces will appear here.";

  return (
    <div className="theme-orange" style={{ position: "absolute", inset: 0, overflowY: "auto", boxSizing: "border-box", padding: "24px 24px 60px" }}>
      <h1 style={{ fontFamily: "var(--font-serif-display)", fontSize: 48, fontWeight: 600, margin: "0 0 20px", color: "#121212", textAlign: "center" }}>Gardner Lens</h1>

      <div className="theme-green" style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
        <IconTextButton variant="primary" size="md" icon={<CameraIconSmall />} onClick={onNewPic} style={{ width: "100%", height: 48 }}>
          New Picture
        </IconTextButton>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: "var(--font-size-xl)", margin: 0, color: "var(--color-neutral-black)" }}>Your Collection</h2>
        <Button variant="secondary" size="sm" aria-disabled="true" title="Coming soon" onClick={(e) => e.preventDefault()}>
          Email Me
        </Button>
      </div>
      <p style={{ fontSize: 14, color: "#464140", margin: "0 0 20px" }}>{subtext}</p>

      {hasCollection ? (
        <ul
          style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}
        >
          {items.map((item) => (
            <CollectionGridItem key={item.artwork_id} item={item} onSelect={() => onSelectItem(item.artwork_id)} />
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#464140", margin: 0 }}>Take your first photo to start your collection!</p>
      )}

      <div style={{ marginTop: 36 }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: "var(--font-size-xl)", margin: "0 0 12px", color: "var(--color-neutral-black)" }}>Your Courtyard Plant</h2>
        {courtyardUnlocked ? (
          <div style={{ display: "flex", background: "white", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-base)", overflow: "hidden" }}>
            <div
              style={{
                width: "40%",
                flexShrink: 0,
                background: "var(--color-neutral-grey-light)",
                borderRight: "1px dashed var(--color-border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
              }}
              aria-hidden="true"
            >
              Image
            </div>
            <div style={{ flex: 1, padding: "var(--space-lg)" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: "#121212" }}>Coming soon</h4>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#464140" }}>
                This is the plant that matches your vibe, chosen from the pieces you've collected.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#464140", margin: 0 }}>
            Once you add 3 objects to your collection, we will show you your courtyard plant that matches your vibe!
          </p>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <Button variant="ghost" size="sm" onClick={onResetSession}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
