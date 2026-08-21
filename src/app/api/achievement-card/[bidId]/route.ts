import { achievementCard } from "./image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/achievement-card/[bidId]">,
) {
  const { bidId } = await context.params;
  return achievementCard(bidId);
}
