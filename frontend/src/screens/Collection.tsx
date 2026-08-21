import { Button } from "../components/Button";
import { CollectionGridItem } from "../components/CollectionGridItem";
import { EmailMeButton } from "../components/EmailMeButton";
import { HighContrastToggle } from "../components/HighContrastToggle";
import { PlantRevealTease } from "../components/PlantRevealTease";
import type { CollectionOut } from "../api/types";

interface CollectionProps {
  collection: CollectionOut | null;
  onNewPic: () => void;
}

/** Design brief Section 3.5 / Section 2: the app's home/base screen -
 * empty at first, filling in as the visit continues. Result drawers open
 * on top of this screen and dismiss back to it (App.tsx owns that). */
export function Collection({ collection, onNewPic }: CollectionProps) {
  const items = collection?.items ?? [];

  return (
    <div className="theme-orange screen screen-collection">
      <div className="screen-topbar">
        <HighContrastToggle />
      </div>

      <header className="collection-header">
        <h1>Your Collection</h1>
        <EmailMeButton />
      </header>

      {items.length === 0 ? (
        <div className="collection-empty-state">
          <p>Take your first photo to start your collection.</p>
          <Button onClick={onNewPic}>Take a Photo</Button>
        </div>
      ) : (
        <>
          <ul className="collection-grid">
            {items.map((item) => (
              <CollectionGridItem key={item.artwork_id} item={item} />
            ))}
          </ul>
          <PlantRevealTease itemCount={items.length} />
          <div className="collection-footer">
            <Button onClick={onNewPic}>New Pic</Button>
          </div>
        </>
      )}
    </div>
  );
}
