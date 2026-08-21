/**
 * Client-side compression before upload - Tech Arch Section 2, pipeline
 * step 1: "Frontend compresses the captured image before upload (wifi-only
 * assumption from PRD - don't send full-res unnecessarily)."
 *
 * Downscales to a max dimension and re-encodes as JPEG. The Tech Arch doc's
 * resolution note (Section 2, "Resolution matters, separately from
 * augmentation") warns against compressing so aggressively that too little
 * detail survives for ORB to work with - 1600px is comfortably above the
 * ~250px failure case that doc found, while still well under what a modern
 * phone camera captures natively.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export async function compressImage(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // No canvas support - fall back to the uncompressed original rather
    // than failing the capture outright.
    return source;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  return await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? source),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
