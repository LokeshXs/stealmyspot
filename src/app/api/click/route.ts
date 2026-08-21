import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ListingStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Obvious crawlers shouldn't inflate anyone's click count. */
const BOT_PATTERN = /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|curl|wget/i;

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (BOT_PATTERN.test(userAgent)) {
    return NextResponse.json({ ok: true, counted: false });
  }

  let id: unknown;
  try {
    ({ id } = (await request.json()) as { id?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;

  try {
    // updateMany rather than update: an unknown id should be a no-op, not a 500.
    const updated = await db.listing.updateMany({
      where: { id, status: ListingStatus.PUBLISHED },
      data: { clickCount: { increment: 1 } },
    });

    if (updated.count > 0) {
      await db.clickEvent.create({ data: { listingId: id, ipHash } });
    }

    return NextResponse.json({ ok: true, counted: updated.count > 0 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
