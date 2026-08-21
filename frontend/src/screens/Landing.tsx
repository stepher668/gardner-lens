import { Button } from "../ds";

interface LandingProps {
  onStart: () => void;
}

const ITINERARIES = [
  {
    heading: "One Hour",
    body: "Pick up a map to find highlights of the art. Look up, down, and around for more art you love.",
    cta: "View Highlights",
  },
  {
    heading: "A Couple Hours",
    body: "Join a free 30-minute public tour. Listen to stories about Isabella through our audio guides.",
    cta: "Book a Tour",
  },
  {
    heading: "Looking for Something New",
    body: "Check out special exhibitions and visit our Courtyard where displays change weekly. Enjoy seasonal meals at Café G.",
    cta: "See Exhibitions",
  },
  {
    heading: "True Crime Enthusiast",
    body: "Head to the Dutch Room and follow our Theft Audio Walk to retrace the steps of the 1990 heist.",
    cta: "Start Audio Walk",
  },
];

const WAYFINDING = [
  { heading: "Museum Maps", body: "View maps in English, Spanish, French, Mandarin, and Japanese to navigate the galleries." },
  { heading: "Audio Guides", body: "Listen to museum stories, gallery overviews, and intimate walks with artists." },
  { heading: "Accessibility", body: "Everyone is welcome. Learn about our accommodations and services." },
];

const SPACES = [
  { icon: "🛍️", heading: "Gift Shop", sub: "Gift at the Gardner" },
  { icon: "🎨", heading: "Create", sub: "Bertucci Education Studio" },
  { icon: "🎵", heading: "Listen", sub: "Calderwood Hall" },
  { icon: "☕", heading: "Eat", sub: "Café G" },
];

/** Design brief Section 3.1: echoes the real site's "While You're Here"
 * page verbatim (per the Claude Design export), indigo theme (Section 6),
 * with the Gardner Lens feature as one card within it - not a separate,
 * stripped-down landing screen. Everything on this page besides the
 * Gardner Lens card is real site chrome/content, inert here exactly as it
 * is in the export (no ticket purchasing or nav menu in this app). */
export function Landing({ onStart }: LandingProps) {
  return (
    <div className="theme-indigo" style={{ height: "100%", overflowY: "auto", boxSizing: "border-box", background: "var(--color-background-default)" }}>
      <header
        style={{
          background: "#fff",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif-display)", fontSize: 13, lineHeight: 1.3, color: "#121212", fontWeight: 600, letterSpacing: "0.5px" }}>
          ISABELLA
          <br />
          STEWART GARDNER
          <br />
          MUSEUM
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="theme-green" style={{ display: "contents" }}>
            <Button variant="primary" size="sm">
              Get Tickets
            </Button>
          </div>
          <span aria-hidden="true" style={{ fontSize: 22, color: "#121212", lineHeight: 1 }}>
            ☰
          </span>
        </div>
      </header>

      <div style={{ background: "var(--color-neutral-grey-lightest)", padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "clamp(32px, 5vw, 42px)",
            lineHeight: 1.2,
            margin: "0 0 16px",
            fontWeight: 400,
            color: "var(--color-neutral-black)",
          }}
        >
          While You're Here
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 700, color: "var(--color-neutral-black)", margin: "0 0 32px" }}>
          Welcome! Isabella Stewart Gardner channeled her passion for art and creativity into this
          Museum. She installed the art according to her own personal logic and taste—so let yours
          guide you through the galleries.
        </p>

        <button
          onClick={onStart}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          <div
            style={{
              backgroundColor: "white",
              boxShadow: "var(--shadow-md)",
              color: "var(--color-text-primary)",
              padding: "var(--space-lg)",
              borderRadius: "var(--radius-base)",
              transition: "var(--transition-sm)",
            }}
          >
            <div style={{ aspectRatio: "16/9", background: "var(--color-neutral-grey-light)", margin: "calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) 16px" }} />
            <h3 style={{ fontSize: 18, color: "#121212", margin: "0 0 8px", fontWeight: 600, borderTop: "1px solid var(--color-border-default)", paddingTop: 16 }}>
              Gardner Lens
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#464140", margin: 0 }}>
              Use your phone to take a picture to learn more about a piece that speaks to you.
            </p>
          </div>
        </button>
      </div>

      <div style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto", background: "var(--color-neutral-grey-lightest)" }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: 30, color: "#121212", margin: "0 0 12px", fontWeight: 400 }}>
          Plan Your Time at the Museum
        </h2>
        <p style={{ fontSize: 16, color: "#464140", margin: "0 0 32px" }}>
          Make the most of your visit with these curated itineraries designed for different time
          commitments.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {ITINERARIES.map((item) => (
            <div key={item.heading} style={{ padding: 24, background: "#fff", borderLeft: "4px solid var(--brand-indigo-accent)" }}>
              <h3 style={{ fontSize: 17, color: "#121212", margin: "0 0 10px", fontWeight: 600 }}>{item.heading}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#464140", margin: "0 0 16px" }}>{item.body}</p>
              <Button variant="secondary" size="sm">
                {item.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto", background: "#f9f7f5" }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: 30, color: "#121212", margin: "0 0 32px", fontWeight: 400 }}>Getting Around</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {WAYFINDING.map((item) => (
            <div key={item.heading} style={{ padding: 20, border: "1px solid #ddd", borderRadius: 4, background: "#fff" }}>
              <h3 style={{ fontSize: 15, color: "#121212", margin: "0 0 10px", fontWeight: 600 }}>{item.heading}</h3>
              <p style={{ fontSize: 13, color: "#464140", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto", background: "var(--color-neutral-grey-lightest)" }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: 30, color: "#121212", margin: "0 0 32px", fontWeight: 400 }}>Museum Spaces</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20 }}>
          {SPACES.map((item) => (
            <div key={item.heading} style={{ textAlign: "center" }}>
              <div
                aria-hidden="true"
                style={{
                  width: 88,
                  height: 88,
                  background: "var(--brand-indigo-accent)",
                  borderRadius: 8,
                  margin: "0 auto 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 36,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: 13, color: "#121212", margin: "0 0 6px", fontWeight: 600 }}>{item.heading}</h3>
              <p style={{ fontSize: 12, color: "#464140", margin: 0 }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto", background: "var(--brand-indigo-darkest)", color: "#fff", textAlign: "center", borderRadius: 4 }}>
        <h2 style={{ fontFamily: "var(--font-serif-display)", fontSize: 30, color: "#fff", margin: "0 0 20px", fontWeight: 400 }}>Lost Something?</h2>
        <p style={{ color: "rgba(255,255,255,0.9)", margin: "0 0 20px", fontSize: 15 }}>
          If you have lost an item, please call the Lost and Found at the Box Office.
        </p>
        <a href="tel:6172785156" style={{ color: "var(--brand-indigo-accent)", textDecoration: "none", fontWeight: 600 }}>
          617-278-5156
        </a>
      </div>
    </div>
  );
}
