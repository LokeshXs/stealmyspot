import "server-only";

import { db } from "@/lib/db";
import { ListingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { imageForIdentity, labelForKey } from "@/lib/identity";
import {
  PAGE_SIZE,
  clampPage,
  nextTopBidCents,
  partitionTakeover,
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
  takeoverState: "HOLDER" | "FROZEN" | "QUEUED" | null;
}

export interface TakeoverSummary {
  listingId: string;
  label: string;
  imageUrl: string | null;
  sourceUrl: string;
  amountCents: number;
  endsAt: string;
  occupiedCount: number;
  queuedCount: number;
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
  takeover: TakeoverSummary | null;
  queuedAmountsCents: number[];
  /** Complete live ledger used for honest post-reservation rank projections. */
  rankingAmountsCents: number[];
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

  const sorted = sortBoard(listings);
  const total = sorted.length;
  const partition = takeover ? partitionTakeover(sorted, takeover) : null;
  const takeoverPageCount = partition
    ? Math.max(1, 1 + Math.ceil(partition.queued.length / PAGE_SIZE))
    : null;
  const page = takeoverPageCount
    ? Math.min(Math.max(1, Math.floor(requestedPage)), takeoverPageCount)
    : clampPage(requestedPage, total);
  const queuedStart = Math.max(0, (page - 2) * PAGE_SIZE);
  const start = partition
    ? page === 1
      ? 0
      : partition.frozen.length + queuedStart
    : (page - 1) * PAGE_SIZE;
  const slice = partition
    ? page === 1
      ? partition.frozen
      : partition.queued.slice(queuedStart, queuedStart + PAGE_SIZE)
    : sorted.slice(start, start + PAGE_SIZE);
  const holder = partition?.frozen[0] ?? null;

  const top = topBidCents(listings);

  return {
    entries: slice.map((listing, index) => ({
      id: listing.id,
      rank: partition
        ? page === 1
          ? index + 1
          : PAGE_SIZE + queuedStart + index + 1
        : start + index + 1,
      identityType: listing.identityType,
      identityKey: listing.identityKey,
      sourceUrl: listing.sourceUrl,
      label: labelForKey(listing.identityKey),
      displayName: listing.displayName,
      description: listing.description,
      imageUrl: imageForIdentity(listing.identityType, listing.imageUrl),
      amountCents: listing.amountCents,
      clickCount: listing.clickCount,
      rankedAt: listing.rankedAt.toISOString(),
      isTakeover: takeover?.listingId === listing.id,
      takeoverState: partition
        ? takeover?.listingId === listing.id
          ? "HOLDER"
          : page === 1
            ? "FROZEN"
            : "QUEUED"
        : null,
    })),
    page,
    pageCount: takeoverPageCount ?? totalPages(total),
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + PAGE_SIZE, total),
    topBidCents: top,
    nextBidCents: nextTopBidCents(top),
    takeoverPriceCents: takeoverPriceCents(top),
    takeoverEndsAt: takeover?.endsAt.toISOString() ?? null,
    takeover: takeover && holder && partition
      ? {
          listingId: holder.id,
          label: labelForKey(holder.identityKey),
          imageUrl: imageForIdentity(holder.identityType, holder.imageUrl),
          sourceUrl: holder.sourceUrl,
          amountCents: takeover.amountCents,
          endsAt: takeover.endsAt.toISOString(),
          occupiedCount: partition.frozen.length,
          queuedCount: partition.queued.length,
        }
      : null,
    queuedAmountsCents: partition ? partition.queued.map((listing) => listing.amountCents) : [],
    rankingAmountsCents: sorted.map((listing) => listing.amountCents),
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
