import { LOGO_PATHS } from "@/components/icons";
import { branding, siteTitle, splitBrandName } from "@/lib/env";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = `${siteTitle} — ${branding.tagline}`;

/**
 * The social card, shared by `opengraph-image` and `twitter-image` so the two
 * cannot drift. Next needs those routes as separate files, but they are both
 * thin wrappers around this.
 *
 * Two Satori rules are load-bearing here and have each broken the build once:
 * every node with more than one child sets `display` explicitly, and the caller
 * must wrap this in `new ImageResponse(...)`.
 *
 * The mark is inline SVG rather than the CSS-border triangle trick — Satori
 * renders those borders as filled squares, which is exactly what shipped here
 * before anyone opened the generated PNG.
 */
export function OgCard() {
  const { lead, accent } = splitBrandName();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: "#0e0e13",
        color: "#f4f4f7",
        fontFamily: "Helvetica, Arial, sans-serif",
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "3px solid #f4f4f7",
          paddingBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="76" height="76" viewBox="0 0 32 32" fill="none">
            <path d={LOGO_PATHS.up} fill="#8b7bff" />
            <path d={LOGO_PATHS.down} fill="#f4f4f7" fillOpacity="0.4" />
          </svg>

          <div style={{ display: "flex", fontSize: 62, fontWeight: 800, letterSpacing: "-0.04em" }}>
            {/*
              `whiteSpace: pre` is required: these spans are flex children, and
              flex drops the trailing space in "Steal My ", welding the words
              into "Steal MySpot".
            */}
            <span style={{ display: "flex", whiteSpace: "pre" }}>{lead}</span>
            <span style={{ display: "flex", color: "#8b7bff" }}>{accent}</span>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#a3a3b0", letterSpacing: "0.18em" }}>
          PAY TO RANK
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1.2,
          maxWidth: 980,
          letterSpacing: "-0.03em",
        }}
      >
        {branding.tagline}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #3a3a45",
          paddingTop: 24,
          fontSize: 24,
          color: "#a3a3b0",
        }}
      >
        <span style={{ display: "flex" }}>{branding.taglineEmphasis}</span>
        <span style={{ display: "flex" }}>01 · 02 · 03</span>
      </div>
    </div>
  );
}
