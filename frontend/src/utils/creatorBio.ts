import type { CreatorOut } from "../api/types";

/**
 * The Result drawer's italic bio line under the title (e.g. "(Florence,
 * 1856 - 1925, London)"), matching the Claude Design export's `bioLine`
 * format for the `person` creator_type. OOUX doc: Creator Type "controls
 * display phrasing" - person gets life-dates/places, organization/culture
 * gets an "active ..." phrasing instead, since "b./d." doesn't make sense
 * for those. None of the 7 pilot creators are non-person yet, but the
 * branch is here so adding one doesn't silently mis-render.
 */
export function formatCreatorBioLine(creator: CreatorOut | undefined): string | null {
  if (!creator) return null;
  const { creator_type, place_start, place_end, date_start, date_end } = creator;

  if (creator_type === "person") {
    const start = [place_start, date_start].filter(Boolean).join(", ");
    const end = [date_end, place_end].filter(Boolean).join(", ");
    const line = [start, end].filter(Boolean).join(" - ");
    return line ? `(${line})` : null;
  }

  const range = [date_start, date_end].filter((v) => v != null).join("–");
  const place = place_start ?? place_end;
  if (!range && !place) return null;
  return `(active${place ? ` ${place}` : ""}${range ? `, ${range}` : ""})`;
}
