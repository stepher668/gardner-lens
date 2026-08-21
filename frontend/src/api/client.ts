import type { ArtworkDetailOut, ArtworkImageOut, CandidateOut, CollectionOut, IdentifyResult } from "./types";

// Same-origin ("") by default - correct for the single-container deploy,
// where the backend serves this build itself (backend/Dockerfile).
// Local dev sets VITE_API_BASE_URL explicitly via .env (copied from
// .env.example) to point at the separately-running backend on :8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** ArtworkImageOut.url comes back as a server-relative path (e.g.
 * "/media/pilot/display/el-jaleo/el-jaleo-1.jpg" - see
 * backend/app/seed/seed_pilot.py's MEDIA_URL_PREFIX), not a full URL, so
 * it needs the API origin prefixed before it's usable in an <img src>. */
function resolveImage(image: ArtworkImageOut | null): ArtworkImageOut | null {
  if (!image) return null;
  if (/^https?:\/\//.test(image.url)) return image;
  return { ...image, url: `${API_BASE}${image.url}` };
}

function resolveArtwork(artwork: ArtworkDetailOut | null): ArtworkDetailOut | null {
  if (!artwork) return null;
  return { ...artwork, image: resolveImage(artwork.image) };
}

function resolveCandidates(candidates: CandidateOut[] | null): CandidateOut[] | null {
  if (!candidates) return null;
  return candidates.map((c) => ({ ...c, image: resolveImage(c.image) }));
}

function resolveIdentifyResult(result: IdentifyResult): IdentifyResult {
  return { ...result, artwork: resolveArtwork(result.artwork), candidates: resolveCandidates(result.candidates) };
}

/** POST /identify - Tech Arch Section 7. `photo` is already compressed
 * client-side (see utils/compressImage.ts) before this is called, per the
 * wifi-only bandwidth assumption in the PRD. */
export async function identify(photo: Blob, sessionId: string | null): Promise<IdentifyResult> {
  const form = new FormData();
  form.append("photo", photo, "capture.jpg");
  if (sessionId) form.append("session_id", sessionId);

  const response = await fetch(`${API_BASE}/identify`, { method: "POST", body: form });
  return resolveIdentifyResult(await asJson<IdentifyResult>(response));
}

/** POST /identify/confirm - visitor tapped a "Did You Mean?" candidate. */
export async function confirmCandidate(sessionId: string | null, artworkId: string): Promise<IdentifyResult> {
  const response = await fetch(`${API_BASE}/identify/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, artwork_id: artworkId }),
  });
  return resolveIdentifyResult(await asJson<IdentifyResult>(response));
}

export async function getArtwork(artworkId: string): Promise<ArtworkDetailOut> {
  const response = await fetch(`${API_BASE}/artwork/${artworkId}`);
  const artwork = await asJson<ArtworkDetailOut>(response);
  return { ...artwork, image: resolveImage(artwork.image) };
}

export async function getCollection(sessionId: string): Promise<CollectionOut> {
  const response = await fetch(`${API_BASE}/collection/${sessionId}`);
  const collection = await asJson<CollectionOut>(response);
  return { ...collection, items: collection.items.map((item) => ({ ...item, image: resolveImage(item.image) })) };
}
