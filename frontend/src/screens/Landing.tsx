import { Button } from "../components/Button";
import { HighContrastToggle } from "../components/HighContrastToggle";

interface LandingProps {
  onStart: () => void;
}

/** Design brief Section 3.1: echoes the real site's "While You're Here"
 * language, indigo (Section 6), a single clear action into the camera. */
export function Landing({ onStart }: LandingProps) {
  return (
    <div className="theme-indigo screen screen-landing">
      <div className="screen-topbar">
        <HighContrastToggle />
      </div>
      <div className="landing-content">
        <div className="landing-icon" aria-hidden="true">
          📷
        </div>
        <h1>While You're Here</h1>
        <p>Take a pic of a piece that speaks to you.</p>
        <p className="landing-subtext">
          Learn about it - title, artist, story - right on your own phone. Nothing changes in the
          gallery; this is just for you, if you want it.
        </p>
        <Button onClick={onStart}>Open Camera</Button>
      </div>
    </div>
  );
}
