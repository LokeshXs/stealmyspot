"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { BidKind, ListingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getRankableListings } from "@/lib/board";
import { normalizeIdentity, type NormalizedIdentity } from "@/lib/identity";
import { resolveRedirect, scrapeMetadata } from "@/lib/metadata";
import { getPaymentProvider } from "@/lib/payments";
import { paymentProvider } from "@/lib/env";
import {
  MIN_BID_CENTS,
  quoteBid,
  takeoverPriceCents,
  topBidCents,
} from "@/lib/ranking";

export interface ActionError {
  error: string;
}

const submitSchema = z.object({
  identity: z.string().trim().min(1).max(300),
  amountCents: z.number().int().finite(),
});

const takeoverSchema = z.object({
  identity: z.string().trim().min(1).max(300),
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

/**
 * In-memory per-IP limit. Enough to keep the metadata scraper from being used as
 * a proxy; a multi-instance deploy would want this in Postgres or Redis.
 */
async function rateLimited(): Promise<boolean> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "local";

  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5_000) hits.clear(); // crude bound on memory

  return recent.length > RATE_LIMIT;
}

// ---------------------------------------------------------------------------
// Shared checkout path
// ---------------------------------------------------------------------------

/**
 * Creates (or reuses) the PENDING listing for an identity and scrapes its card.
 * Metadata is refreshed on every bid so a listing that changed its tagline updates.
 */
async function upsertListing(identity: NormalizedIdentity) {
  const existing = await db.listing.findUnique({
    where: { identityKey: identity.identityKey },
  });

  const needsMetadata =
    identity.identityType === "WEBSITE" && (!existing || !existing.displayName);

  const scraped = needsMetadata
    ? await scrapeMetadata(identity.sourceUrl)
    : { displayName: null, description: null, imageUrl: null };

  if (existing) {
    if (scraped.displayName || scraped.description || scraped.imageUrl) {
      return db.listing.update({
        where: { id: existing.id },
        data: {
          displayName: scraped.displayName ?? existing.displayName,
          description: scraped.description ?? existing.description,
          imageUrl: scraped.imageUrl ?? existing.imageUrl,
        },
      });
    }
    return existing;
  }

  return db.listing.create({
    data: {
      identityType: identity.identityType,
      identityKey: identity.identityKey,
      sourceUrl: identity.sourceUrl,
      displayName: scraped.displayName ?? identity.label,
      description: scraped.description,
      imageUrl: scraped.imageUrl,
      status: ListingStatus.PENDING,
      amountCents: 0,
    },
  });
}

async function beginCheckout(args: {
  identity: NormalizedIdentity;
  totalAmountCents: number;
  payableCents: number;
  kind: BidKind;
}): Promise<string> {
  const listing = await upsertListing(args.identity);

  const bid = await db.bid.create({
    data: {
      listingId: listing.id,
      amountCents: args.totalAmountCents,
      paidCents: args.payableCents,
      kind: args.kind,
      status: PaymentStatus.PENDING,
      provider: paymentProvider,
    },
  });

  const provider = await getPaymentProvider();
  const session = await provider.createCheckout({
    bidId: bid.id,
    listingId: listing.id,
    identityKey: args.identity.identityKey,
    amountCents: args.payableCents,
    totalAmountCents: args.totalAmountCents,
    kind: args.kind,
    label: args.identity.label,
  });

  await db.bid.update({
    where: { id: bid.id },
    data: { sessionId: session.sessionId },
  });

  return session.url;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function submitBid(input: {
  identity: string;
  amountCents: number;
}): Promise<ActionError | void> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a URL or @handle and a whole dollar amount." };

  if (await rateLimited()) {
    return { error: "Too many attempts. Give it a few minutes and try again." };
  }

  const identityResult = await normalizeIdentity(parsed.data.identity, resolveRedirect);
  if (!identityResult.ok) return { error: identityResult.message };

  const identity = identityResult.identity;

  const [existing, listings] = await Promise.all([
    db.listing.findUnique({
      where: { identityKey: identity.identityKey },
      select: { id: true, amountCents: true, rankedAt: true, status: true },
    }),
    getRankableListings(),
  ]);

  // A PENDING listing has never been paid for, so it holds no bid to raise from.
  const onBoard =
    existing && existing.status === ListingStatus.PUBLISHED ? existing : null;

  const quote = quoteBid({
    existingListing: onBoard,
    newAmountCents: parsed.data.amountCents,
    listings,
  });

  if (!quote.ok) {
    if (quote.errors.includes("not_higher_than_current") && onBoard) {
      return {
        error: `You already hold that listing at $${onBoard.amountCents / 100}. Bid more than that to move it up.`,
      };
    }
    if (quote.errors.includes("below_minimum")) {
      return { error: `The minimum bid is $${MIN_BID_CENTS / 100}.` };
    }
    return { error: "Bids are whole US dollars, $1 at a time." };
  }

  const url = await beginCheckout({
    identity,
    totalAmountCents: quote.amountCents,
    payableCents: quote.payableCents,
    kind: BidKind.BID,
  });

  redirect(url);
}

export async function startTakeover(input: { identity: string }): Promise<ActionError | void> {
  const parsed = takeoverSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter the URL or @handle you want on top." };

  if (await rateLimited()) {
    return { error: "Too many attempts. Give it a few minutes and try again." };
  }

  const active = await db.takeover.findFirst({ where: { endsAt: { gt: new Date() } } });
  if (active) {
    return { error: "A takeover is already live. Only one can run at a time." };
  }

  const identityResult = await normalizeIdentity(parsed.data.identity, resolveRedirect);
  if (!identityResult.ok) return { error: identityResult.message };

  const listings = await getRankableListings();
  const price = takeoverPriceCents(topBidCents(listings));

  const url = await beginCheckout({
    identity: identityResult.identity,
    totalAmountCents: price,
    payableCents: price,
    kind: BidKind.TAKEOVER,
  });

  redirect(url);
}
