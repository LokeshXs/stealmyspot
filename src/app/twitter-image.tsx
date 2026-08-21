import { ImageResponse } from "next/og";
import { branding, siteTitle } from "@/lib/env";

export const alt = `${siteTitle} — ${branding.taglineEmphasis}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori requires an explicit `display` on every element with more than one child,
// so each node below sets it deliberately.
export default async function OpenGraphImage() {
  const bar = (width: number, marginLeft: number, background: string) => ({
    display: "flex" as const,
    width,
    height: 20,
    borderRadius: 10,
    marginLeft,
    background,
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0e0e13",
          color: "#f4f4f7",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={bar(46, 74, "#6d5cf6")} />
            <div style={bar(80, 40, "#f4f4f7")} />
            <div style={bar(120, 0, "#f4f4f7")} />
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: "-0.04em" }}>
            <span style={{ display: "flex" }}>{branding.name}</span>
            <span style={{ display: "flex", color: "#6d5cf6" }}>{branding.tld.slice(0, 1)}</span>
            <span style={{ display: "flex" }}>{branding.tld.slice(1)}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 36,
            lineHeight: 1.35,
            textAlign: "center",
            color: "#a3a3b0",
            maxWidth: 940,
          }}
        >
          {branding.tagline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            fontWeight: 700,
            color: "#8b7bff",
          }}
        >
          {branding.taglineEmphasis}
        </div>
      </div>
    ),
    size,
  );
}
