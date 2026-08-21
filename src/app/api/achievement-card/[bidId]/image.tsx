import { ImageResponse } from "next/og";
import { LOGO_PATHS } from "@/components/icons";
import { PaymentStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { branding } from "@/lib/env";
import { formatDollars } from "@/lib/format";
import { labelForKey } from "@/lib/identity";
import { fetchPublicImageDataUrl } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CARD = { paper: "#fbfbfd", ink: "#17171f", purple: "#6d5cf6", muted: "#63636f", white: "#ffffff" };

export interface AchievementCardData {
  label: string;
  logoDataUrl: string | null;
  achievedRank: number;
  amountCents: number;
}

export async function achievementCard(bidId: string) {
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    select: { status: true, amountCents: true, achievedRank: true, listing: { select: { identityKey: true, imageUrl: true } } },
  });
  if (!bid) return new Response("Unknown bid", { status: 404 });
  if (bid.status !== PaymentStatus.PAID || !bid.achievedRank) return new Response("Achievement is not available", { status: 409 });

  const logoDataUrl = bid.listing.imageUrl ? await fetchPublicImageDataUrl(bid.listing.imageUrl) : null;
  return renderAchievementCard({ label: labelForKey(bid.listing.identityKey), logoDataUrl, achievedRank: bid.achievedRank, amountCents: bid.amountCents });
}

function LedgerLabel({ children }: { children: string }) {
  return <div style={{ display: "flex", color: CARD.muted, fontSize: 15, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>{children}</div>;
}

/** Pure renderer shared by the route and visual tests. */
export function renderAchievementCard({ label, logoDataUrl, achievedRank, amountCents }: AchievementCardData) {
  const displayLabel = label.length > 42 ? `${label.slice(0, 41)}…` : label;
  const displayedRank = String(achievedRank).padStart(2, "0");
  const rankFontSize = displayedRank.length <= 2 ? 138 : displayedRank.length === 3 ? 112 : 84;
  const initial = displayLabel.charAt(0).toUpperCase() || "S";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: CARD.ink, padding: "0 18px 18px 0", fontFamily: "sans-serif" }}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", border: `3px solid ${CARD.ink}`, background: CARD.paper, color: CARD.ink }}>
        <div style={{ height: 84, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${CARD.ink}`, padding: "0 38px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="34" height="34" viewBox="0 0 32 32"><path d={LOGO_PATHS.up} fill={CARD.purple} /><path d={LOGO_PATHS.down} fill={CARD.ink} opacity="0.36" /></svg>
            <div style={{ display: "flex", marginLeft: 12, fontSize: 28, fontWeight: 900, letterSpacing: -1.2 }}>{branding.name}</div>
          </div>
          <div style={{ display: "flex", border: `2px solid ${CARD.ink}`, background: "#eeebff", padding: "8px 12px", fontSize: 14, fontWeight: 900, letterSpacing: 2.6 }}>PAYMENT CLEARED</div>
        </div>

        <div style={{ height: 298, flexShrink: 0, display: "flex", borderBottom: `3px solid ${CARD.ink}` }}>
          <div style={{ width: 302, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: `3px solid ${CARD.ink}`, background: CARD.purple, color: CARD.white }}>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 900, letterSpacing: 5 }}>SPOT</div>
            <div style={{ display: "flex", marginTop: 2, fontSize: rankFontSize, lineHeight: 0.92, fontWeight: 900, letterSpacing: -8 }}>{displayedRank}</div>
            <div style={{ display: "flex", marginTop: 16, border: `1px solid ${CARD.white}`, padding: "6px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 2.4 }}>LEDGER ENTRY</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 42px" }}>
            <div style={{ display: "flex", color: CARD.purple, fontSize: 15, fontWeight: 900, letterSpacing: 3.4 }}>YOUR SPOT IS LIVE</div>
            <div style={{ display: "flex", marginTop: 10, maxWidth: 730, fontSize: displayLabel.length > 30 ? 40 : 48, lineHeight: 1.05, fontWeight: 900, letterSpacing: -1.8 }}>{displayLabel}</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 25 }}>
              <div style={{ width: 66, height: 66, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `2px solid ${CARD.ink}`, background: CARD.white, fontSize: 28, fontWeight: 900 }}>
                {logoDataUrl ? (
                  // ImageResponse requires a plain image element for embedded data URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoDataUrl} alt="" width="66" height="66" style={{ objectFit: "cover" }} />
                ) : initial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
                <div style={{ display: "flex", color: CARD.muted, fontSize: 15, fontWeight: 800, letterSpacing: 2.2 }}>PAID PLACEMENT</div>
                {achievedRank === 1 ? <div style={{ alignSelf: "flex-start", display: "flex", marginTop: 7, border: `2px solid ${CARD.ink}`, background: CARD.purple, color: CARD.white, padding: "4px 8px", fontSize: 12, fontWeight: 900, letterSpacing: 1.8 }}>LEADER</div> : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 142, flexShrink: 0, display: "flex", borderBottom: `3px solid ${CARD.ink}` }}>
          <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `3px solid ${CARD.ink}`, padding: "0 38px" }}><LedgerLabel>Standing bid</LedgerLabel><div style={{ display: "flex", marginTop: 8, fontSize: 48, fontWeight: 900, letterSpacing: -2 }}>{formatDollars(amountCents)}</div></div>
          <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 38px" }}><LedgerLabel>Next bid to pass</LedgerLabel><div style={{ display: "flex", marginTop: 8, fontSize: 48, fontWeight: 900, letterSpacing: -2 }}>{formatDollars(amountCents + 100)}</div></div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 38px", fontSize: 18, fontWeight: 700 }}>
          <div style={{ display: "flex", color: CARD.muted }}>Positions are bought, not earned.</div>
          <div style={{ display: "flex", fontWeight: 900 }}>stealmyspot.lol</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "cache-control": "private, max-age=300" } },
  );
}
