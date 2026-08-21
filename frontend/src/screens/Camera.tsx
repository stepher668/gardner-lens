import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { IconTextButton } from "../ds";
import { CandidateCard } from "../components/CandidateCard";
import { confirmCandidate, identify } from "../api/client";
import { compressImage } from "../utils/compressImage";
import type { ArtworkDetailOut, CandidateOut } from "../api/types";

type InternalState =
  | { kind: "viewfinder" }
  | { kind: "identifying" }
  | { kind: "did_you_mean"; candidates: CandidateOut[] }
  | { kind: "no_match" }
  | { kind: "camera_unavailable" };

interface CameraProps {
  sessionId: string | null;
  onSessionId: (id: string) => void;
  onResolved: (artwork: ArtworkDetailOut) => void;
  collectionCount: number;
  onGoToCollection: () => void;
}

const CameraRetryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--color-brand-green-dark)" }}>
    <path
      d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.5" r="3.6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CameraIconSmall = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(180deg)", verticalAlign: "-3px" }}>
    <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M9 21h6" />
  </svg>
);

/** Design brief Section 3.2 + 3.4: full-screen camera-first capture, all
 * three match-result tiers overlay this screen (orange, Section 6). Visual
 * treatment matches the Claude Design export (Gardner Lens.dc.html); the
 * matching/identify wiring is real (the export simulates with
 * Math.random() since it has no backend). */
export function Camera({ sessionId, onSessionId, onResolved, collectionCount, onGoToCollection }: CameraProps) {
  const [state, setState] = useState<InternalState>({ kind: "viewfinder" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.kind !== "viewfinder") return;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        // No camera / permission denied - the accessible file-input
        // fallback still works (PRD Section 4: screen-reader / switch-
        // control usable path, without the explicitly-rejected in-app
        // manual search).
        if (!cancelled) setState({ kind: "camera_unavailable" });
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [state.kind]);

  const runIdentify = useCallback(
    async (photo: Blob) => {
      setState({ kind: "identifying" });
      try {
        const compressed = await compressImage(photo);
        const result = await identify(compressed, sessionId);
        onSessionId(result.session_id);

        if (result.tier === "confident" && result.artwork) {
          onResolved(result.artwork);
          setState({ kind: "viewfinder" });
        } else if (result.tier === "did_you_mean" && result.candidates) {
          setState({ kind: "did_you_mean", candidates: result.candidates });
        } else {
          setState({ kind: "no_match" });
        }
      } catch {
        setState({ kind: "no_match" });
      }
    },
    [sessionId, onSessionId, onResolved],
  );

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) void runIdentify(blob);
      },
      "image/jpeg",
      0.92,
    );
  }, [runIdentify]);

  const handleFileChosen = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void runIdentify(file);
    },
    [runIdentify],
  );

  const handleCandidateTap = useCallback(
    async (candidateId: string) => {
      setState({ kind: "identifying" });
      try {
        const result = await confirmCandidate(sessionId, candidateId);
        onSessionId(result.session_id);
        if (result.artwork) onResolved(result.artwork);
        setState({ kind: "viewfinder" });
      } catch {
        setState({ kind: "no_match" });
      }
    },
    [sessionId, onSessionId, onResolved],
  );

  const chooseFileButton = (label: string) => (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      style={{
        background: "none",
        border: "none",
        color: "#fff",
        textDecoration: "underline",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="theme-orange" style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        onChange={handleFileChosen}
        aria-label="Choose or take a photo of the artwork"
      />

      {state.kind === "camera_unavailable" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#101010" }}>
          <div style={{ maxWidth: 320, textAlign: "center", color: "#f3f3f3" }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 20px", color: "#e0e0e0" }}>
              Camera access isn't available. You can still choose a photo of the piece from your device.
            </p>
            {chooseFileButton("Choose a Photo")}
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-58%)",
          width: "72%",
          maxWidth: 480,
          aspectRatio: "4/3",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <span style={{ position: "absolute", top: 0, left: 0, width: 36, height: 36, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderTopLeftRadius: 14 }} />
        <span style={{ position: "absolute", top: 0, right: 0, width: 36, height: 36, borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderTopRightRadius: 14 }} />
        <span
          style={{ position: "absolute", bottom: 0, left: 0, width: 36, height: 36, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderBottomLeftRadius: 14 }}
        />
        <span
          style={{ position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderBottomRightRadius: 14 }}
        />
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translate(-50%,16px)",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 14,
            padding: "8px 16px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          Get close — fill the frame with one piece
        </div>
      </div>

      {collectionCount > 0 && (
        <button
          onClick={onGoToCollection}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: 20,
            padding: "8px 16px",
            fontSize: 13,
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}
        >
          Collection ({collectionCount})
        </button>
      )}

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "32px 0 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <button
          onClick={handleCapture}
          disabled={state.kind !== "viewfinder"}
          aria-label="Take a photo of the piece in front of you"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "#fff",
            border: "5px solid var(--accent)",
            cursor: state.kind === "viewfinder" ? "pointer" : "not-allowed",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        />
        {state.kind === "viewfinder" && chooseFileButton("Choose a Photo Instead")}
      </div>

      {state.kind === "identifying" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#fff", fontSize: 16, letterSpacing: "1px", animation: "gl-pulse 1.1s ease-in-out infinite" }}>Analyzing your photo…</div>
        </div>
      )}

      {state.kind === "did_you_mean" && (
        <DidYouMeanOverlay candidates={state.candidates} onPick={handleCandidateTap} onNoneOfThese={() => setState({ kind: "no_match" })} />
      )}
      {state.kind === "no_match" && <NoMatchOverlay onRetry={() => setState({ kind: "viewfinder" })} />}
    </div>
  );
}

interface DidYouMeanOverlayProps {
  candidates: CandidateOut[];
  onPick: (id: string) => void;
  onNoneOfThese: () => void;
}

/** Tier 2 (design brief Section 3.4 / export screen "Multiple Objects
 * Found"): up to 4 tappable candidates, ranked highest-first, real
 * reference images with real text labels, never padded. Close (X) and
 * "New Picture" both act as the "None of these" escape hatch, routing to
 * Tier 3 - matches the export exactly, and matches the design brief's own
 * spec for where that escape hatch should land. */
function DidYouMeanOverlay({ candidates, onPick, onNoneOfThese }: DidYouMeanOverlayProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dym-heading"
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        background: "var(--color-neutral-grey-lightest)",
        border: "1px solid var(--color-border-default)",
        boxShadow: "var(--shadow-lg)",
        padding: "20px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 id="dym-heading" ref={headingRef} tabIndex={-1} style={{ fontFamily: "var(--font-serif-display)", fontSize: 22, margin: 0, color: "#121212" }}>
          Did You Mean…?
        </h2>
        <button
          onClick={onNoneOfThese}
          aria-label="Close"
          style={{ width: 34, height: 34, background: "#121212", border: "none", color: "#fff", fontSize: 16, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} onSelect={() => onPick(candidate.id)} />
        ))}
      </div>
      <hr style={{ border: "none", borderTop: "1px solid var(--color-border-default)", margin: "20px 0", width: "100%" }} />
      <div className="theme-green" style={{ display: "flex", flexDirection: "column" }}>
        <IconTextButton variant="primary" size="md" icon={<CameraIconSmall />} onClick={onNoneOfThese} style={{ width: "100%", height: 48 }}>
          New Picture
        </IconTextButton>
      </div>
    </div>
  );
}

/** Tier 3 (design brief Section 3.4 / export screen "No results found"):
 * plain, warm retry prompt. No candidate list, no external links. */
function NoMatchOverlay({ onRetry }: { onRetry: () => void }) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="No results found"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 32,
        boxSizing: "border-box",
      }}
    >
      <p ref={headingRef} tabIndex={-1} style={{ color: "#fff", fontSize: 17, lineHeight: 1.5, textAlign: "center", margin: 0, maxWidth: 280 }}>
        No results found.
        <br />
        Use the camera button to try again.
      </p>
      <button
        onClick={onRetry}
        aria-label="Try again"
        style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <CameraRetryIcon />
      </button>
    </div>
  );
}
