import "server-only";

import { db } from "@/lib/db";
import { ListingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { labelForKey } from "@/lib/identity";
import {
  PAGE_SIZE,
  applyTakeover,
  clampPage,
  nextTopBidCents,
  sortBoard,
  takeoverPriceCents,
  topBidCents,
  totalPages,
} from "@/lib/ranking";

/** A row as the UI needs it — no Prisma types leak into components. */
export interface BoardEntry {
  id: string;
  rank: number;
  identityType: "WEBSITE" | "X";
  identityKey: string;
  sourceUrl: string;
  label: string;
  displayName: string | null;
  description: string | null;
  imageUrl: string | null;
  amountCents: number;
  clickCount: number;
  rankedAt: string;
  isTakeover: boolean;
}

export interface BoardPage {
  entries: BoardEntry[];
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  topBidCents: number;
  nextBidCents: number;
  takeoverPriceCents: number;
  takeoverEndsAt: string | null;
}

async function activeTakeover() {
  return db.takeover.findFirst({
    where: { endsAt: { gt: new Date() } },
    orderBy: { startsAt: "desc" },
  });
}

/**
 * Builds one page of the board.
 *
 * The full published set is loaded and ordered in memory rather than in SQL:
 * an active takeover reorders the head of the list in a way `ORDER BY` can't
 * express, and the board is small enough (hundreds of rows) that it is cheap.
 */
export async function getBoardPage(requestedPage: number): Promise<BoardPage> {
  const [listings, takeover] = await Promise.all([
    db.listing.findMany({
      where: { status: ListingStatus.PUBLISHED },
      select: {
        id: true,
        identityType: true,
        identityKey: true,
        sourceUrl: true,
        displayName: true,
        description: true,
        imageUrl: true,
        amountCents: true,
        clickCount: true,
        rankedAt: true,
      },
    }),
    activeTakeover(),
  ]);

  const ordered = applyTakeover(sortBoard(listings), takeover);
  const total = ordered.length;
  const page = clampPage(requestedPage, total);
  const start = (page - 1) * PAGE_SIZE;
  const slice = ordered.slice(start, start + PAGE_SIZE);

  const top = topBidCents(listings);

  return {
    entries: slice.map((listing, index) => ({
      id: listing.id,
      rank: start + index + 1,
      identityType: listing.identityType,
      identityKey: listing.identityKey,
      sourceUrl: listing.sourceUrl,
      label: labelForKey(listing.identityKey),
      displayName: listing.displayName,
      description: listing.description,
      imageUrl: listing.imageUrl,
      amountCents: listing.amountCents,
      clickCount: listing.clickCount,
      rankedAt: listing.rankedAt.toISOString(),
      isTakeover: takeover?.listingId === listing.id,
    })),
    page,
    pageCount: totalPages(total),
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + PAGE_SIZE, total),
    topBidCents: top,
    nextBidCents: nextTopBidCents(top),
    takeoverPriceCents: takeoverPriceCents(top),
    takeoverEndsAt: takeover?.endsAt.toISOString() ?? null,
  };
}

/** The minimal rankable set used to price a bid before checkout. */
export async function getRankableListings() {
  return db.listing.findMany({
    where: { status: ListingStatus.PUBLISHED },
    select: { id: true, amountCents: true, rankedAt: true },
  });
}

export async function getStats() {
  const [listingCount, clickAgg, paidAgg] = await Promise.all([
    db.listing.count({ where: { status: ListingStatus.PUBLISHED } }),
    db.listing.aggregate({
      where: { status: ListingStatus.PUBLISHED },
      _sum: { clickCount: true },
    }),
    db.bid.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { paidCents: true },
      _count: true,
    }),
  ]);

  return {
    listingCount,
    totalClicks: clickAgg._sum.clickCount ?? 0,
    volumeCents: paidAgg._sum.paidCents ?? 0,
    bidCount: paidAgg._count,
  };
}
