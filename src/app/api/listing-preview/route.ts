import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { IdentityType } from "@/generated/prisma/enums";
import { imageForIdentity, normalizeIdentity } from "@/lib/identity";
import { resolveRedirect, scrapeMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export interface ListingPreviewResponse {
  identityType: "WEBSITE" | "X";
  identityKey: string;
  label: string;
  imageUrl: string | null;
}

async function rateLimited(): Promise<boolean> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > RATE_LIMIT;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("identity") ?? "";
  if (!raw.trim() || raw.length > 300) {
    return NextResponse.json({ error: "Enter a valid address or @handle." }, { status: 400 });
  }

  if (await rateLimited()) {
    return NextResponse.json({ error: "Too many preview requests." }, { status: 429 });
  }

  try {
    const result = await normalizeIdentity(raw, resolveRedirect);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const { identity } = result;
    const metadata =
      identity.identityType === IdentityType.WEBSITE
        ? await scrapeMetadata(identity.sourceUrl)
        : null;

    const response: ListingPreviewResponse = {
      identityType: identity.identityType,
      identityKey: identity.identityKey,
      label: identity.label,
      imageUrl: imageForIdentity(identity.identityType, metadata?.imageUrl ?? null),
    };
    return NextResponse.json(response, {
      headers: { "cache-control": "private, max-age=300" },
    });
  } catch (error) {
    console.warn(
      "[listing preview] failed:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json({ error: "Could not preview this listing." }, { status: 502 });
  }
}
