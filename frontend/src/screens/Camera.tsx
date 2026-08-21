import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { CandidateCard } from "../components/CandidateCard";
import { HighContrastToggle } from "../components/HighContrastToggle";
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
}

/** Design brief Section 3.2 + 3.4: full-screen camera-first capture, all
 * three match-result tiers overlay this screen (orange, Section 6). */
export function Camera({ sessionId, onSessionId, onResolved }: CameraProps) {
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
        // fallback below still works (PRD Section 4: screen-reader /
        // switch-control usable path, without the explicitly-rejected
        // in-app manual search).
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
    canvas.toBlob((blob) => {
      if (blob) void runIdentify(blob);
    }, "image/jpeg", 0.92);
  }, [runIdentify]);

  const handleFileChosen = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="theme-orange screen screen-camera">
      <div className="camera-viewport">
        {state.kind !== "camera_unavailable" && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" aria-hidden="true" />
        )}
        <div className="camera-framing-guide" aria-hidden="true" />
      </div>

      <div className="screen-topbar camera-topbar">
        <HighContrastToggle />
      </div>

      <div className="camera-controls">
        <p className="camera-hint">Get close - fill the frame with one piece.</p>
        <div className="camera-actions">
          <Button
            onClick={handleCapture}
            disabled={state.kind !== "viewfinder"}
            aria-label="Take a photo of the piece in front of you"
          >
            {state.kind === "identifying" ? "Looking..." : "Take Photo"}
          </Button>
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Choose a Photo Instead
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={handleFileChosen}
            aria-label="Choose or take a photo of the artwork"
          />
        </div>
        {state.kind === "camera_unavailable" && (
          <p role="status">Camera not available - use "Choose a Photo Instead" above.</p>
        )}
      </div>

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

/** Tier 2 (design brief Section 3.4): up to 4 tappable candidates, ranked
 * highest-first, real reference images with real text labels, never
 * padded. A genuine question, not an error state. */
function DidYouMeanOverlay({ candidates, onPick, onNoneOfThese }: DidYouMeanOverlayProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="dym-heading">
      <h2 id="dym-heading" ref={headingRef} tabIndex={-1}>
        Which one is this?
      </h2>
      <ul className="candidate-list">
        {candidates.map((candidate) => (
          <li key={candidate.id}>
            <CandidateCard candidate={candidate} onSelect={() => onPick(candidate.id)} />
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-secondary" onClick={onNoneOfThese}>
        None of these
      </button>
    </div>
  );
}

/** Tier 3 (design brief Section 3.4): plain, warm retry prompt. No
 * candidate list, no external links. */
function NoMatchOverlay({ onRetry }: { onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="no-match-heading">
      <h2 id="no-match-heading" ref={headingRef} tabIndex={-1}>
        We couldn't quite place that one
      </h2>
      <p>Try getting a little closer, with just one piece filling the frame.</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  );
}
