import { renderAchievementCard } from "../[bidId]/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public mock so the navbar can preview the exact card buyers receive. */
export function GET() {
  return renderAchievementCard({
    label: "mockup.product",
    logoDataUrl: null,
    achievedRank: 1,
    amountCents: 1400,
  });
}
