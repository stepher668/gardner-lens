import type { ArtworkDetailOut, CollectionOut, IdentifyResult } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** POST /identify - Tech Arch Section 7. `photo` is already compressed
 * client-side (see utils/compressImage.ts) before this is called, per the
 * wifi-only bandwidth assumption in the PRD. */
export async function identify(photo: Blob, sessionId: string | null): Promise<IdentifyResult> {
  const form = new FormData();
  form.append("photo", photo, "capture.jpg");
  if (sessionId) form.append("session_id", sessionId);

  const response = await fetch(`${API_BASE}/identify`, { method: "POST", body: form });
  return asJson<IdentifyResult>(response);
}

/** POST /identify/confirm - visitor tapped a "Did You Mean?" candidate. */
export async function confirmCandidate(sessionId: string | null, artworkId: string): Promise<IdentifyResult> {
  const response = await fetch(`${API_BASE}/identify/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, artwork_id: artworkId }),
  });
  return asJson<IdentifyResult>(response);
}

export async function getArtwork(artworkId: string): Promise<ArtworkDetailOut> {
  const response = await fetch(`${API_BASE}/artwork/${artworkId}`);
  return asJson<ArtworkDetailOut>(response);
}

export async function getCollection(sessionId: string): Promise<CollectionOut> {
  const response = await fetch(`${API_BASE}/collection/${sessionId}`);
  return asJson<CollectionOut>(response);
}
