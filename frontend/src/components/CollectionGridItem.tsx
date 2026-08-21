import type { CollectionItemOut } from "../api/types";

export function CollectionGridItem({ item }: { item: CollectionItemOut }) {
  return (
    <li className="collection-grid-item">
      {item.image ? (
        <img className="card-image" src={item.image.url} alt={item.image.alt_text} />
      ) : (
        <div className="card-image card-image-placeholder" aria-hidden="true" />
      )}
      <span className="collection-grid-item-title">{item.title}</span>
    </li>
  );
}
