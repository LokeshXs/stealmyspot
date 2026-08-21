import { ImageResponse } from "next/og";
import { branding, siteTitle } from "@/lib/env";

export const alt = `${siteTitle} — ${branding.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori needs an explicit `display` on every element with more than one child,
// so each node below sets it deliberately. Getting this wrong breaks the build.
export default async function OpenGraphImage() {
  const bracket = (side: "left" | "right") => ({
    display: "flex" as const,
    width: 18,
    height: 84,
    borderTop: "4px solid #f4f4f7",
    borderBottom: "4px solid #f4f4f7",
    ...(side === "left"
      ? { borderLeft: "4px solid #f4f4f7" }
      : { borderRight: "4px solid #f4f4f7" }),
    opacity: 0.55,
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#0e0e13",
          color: "#f4f4f7",
          fontFamily: "Georgia, serif",
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
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={bracket("left")} />
              <div
                style={{
                  display: "flex",
                  width: 0,
                  height: 0,
                  borderLeft: "26px solid transparent",
                  borderRight: "26px solid transparent",
                  borderBottom: "44px solid #8b7bff",
                }}
              />
              <div style={bracket("right")} />
            </div>
            <div style={{ display: "flex", fontSize: 62, letterSpacing: "-0.02em" }}>
              <span style={{ display: "flex" }}>{branding.name}</span>
              <span style={{ display: "flex", color: "#a3a3b0" }}>{branding.tld}</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#a3a3b0", letterSpacing: "0.14em" }}>
            THE LEDGER
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 54,
            lineHeight: 1.28,
            maxWidth: 980,
            letterSpacing: "-0.01em",
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
    ),
    size,
  );
}
