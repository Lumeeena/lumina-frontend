import { SITE_NAME } from "@/lib/site";

/**
 * The share-card layout, shared by the default card and the per-account one so
 * a link preview always looks like it came from this site.
 *
 * Rendered by Satori, not a browser, which is why this is flexbox-only with no
 * `className`: `display: grid`, CSS shorthand and most of the cascade do not
 * exist there, so anything a card needs is written out in full.
 */
export default function OgCard({
  eyebrow,
  title,
  subtitle,
}: {
  /** Small label above the title, e.g. "Stellar account". */
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundImage: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #8b5cf6 75%, #a78bfa 100%)",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* The same mark as the favicon — a ring with an offset dot. */}
        <div style={{ position: "relative", display: "flex", width: 64, height: 56 }}>
          <div
            style={{
              display: "flex",
              width: 50,
              height: 50,
              borderRadius: 9999,
              border: "3px solid rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: 9999,
              backgroundColor: "#ffffff",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 26,
            fontSize: 34,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {SITE_NAME}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.78)",
            marginBottom: 18,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.14, color: "#ffffff" }}>
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
