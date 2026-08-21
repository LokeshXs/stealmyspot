/**
 * Pure ranking + pricing rules. No IO, no Prisma — everything here is unit-tested.
 *
 * The whole product reduces to one invariant: **rank is the bid**. Rows are ordered
 * by amount descending, and ties are broken by who got there first.
 */

/** Whole US dollars only. The board opens at $1. */
export const MIN_BID_CENTS = 100;

/**
 * Ceiling on a single bid.
 *
 * `Listing.amountCents` is a Prisma `Int`, i.e. a 32-bit Postgres integer
 * capped at 2,147,483,647 ($21,474,836.47). Anything above that is not a
 * validation nicety — it is an unhandled "out of range for type integer" from
 * the database.
 *
 * The cap must also survive a takeover, which costs TAKEOVER_MULTIPLIER × the
 * standing top bid. At $1,000,000 the worst case is a $2,000,000 takeover —
 * two orders of magnitude clear of the column limit.
 */
export const MAX_BID_CENTS = 100_000_000;
export const INCREMENT_CENTS = 100;
export const PAGE_SIZE = 50;
export const TAKEOVER_HOURS = 3;
export const TAKEOVER_MULTIPLIER = 2;

/** The minimum shape ranking cares about. Real Listings satisfy this structurally. */
export interface RankableListing {
  id: string;
  amountCents: number;
  rankedAt: Date;
}

export interface ActiveTakeover {
  listingId: string;
  endsAt: Date;
  frozenIds: string[];
}

/**
 * Canonical board order: amount DESC, then rankedAt ASC.
 * Equal bids keep the order they were placed — the older bid holds the higher rank.
 */
export function sortBoard<T extends RankableListing>(listings: readonly T[]): T[] {
  return [...listings].sort((a, b) => {
    if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
    const delta = a.rankedAt.getTime() - b.rankedAt.getTime();
    if (delta !== 0) return delta;
    // Fully deterministic even when two rows share a timestamp to the millisecond.
    return a.id.localeCompare(b.id);
  });
}

export function topBidCents(listings: readonly RankableListing[]): number {
  return listings.reduce((max, l) => (l.amountCents > max ? l.amountCents : max), 0);
}

/** What it costs to claim #1 right now. An empty board opens at the minimum. */
export function nextTopBidCents(topCents: number): number {
  if (topCents <= 0) return MIN_BID_CENTS;
  return topCents + INCREMENT_CENTS;
}

/**
 * Where `amountCents` would land if it were paid right now.
 *
 * A new bid equal to an existing one ranks *below* it (the older bid wins the tie),
 * so every listing at or above the amount is counted.
 */
export function previewRank(
  amountCents: number,
  listings: readonly RankableListing[],
  opts: { excludeListingId?: string } = {},
): number {
  const ahead = listings.filter(
    (l) => l.id !== opts.excludeListingId && l.amountCents >= amountCents,
  ).length;
  return ahead + 1;
}

export type QuoteErrorCode =
  | "not_a_whole_dollar"
  | "below_minimum"
  | "above_maximum"
  | "not_higher_than_current"
  | "not_a_number";

export interface QuoteInput {
  /** The listing already on the board for this identity, if any. */
  existingListing?: RankableListing | null;
  newAmountCents: number;
  listings: readonly RankableListing[];
}

export interface Quote {
  ok: boolean;
  errors: QuoteErrorCode[];
  /** What we actually charge — only the difference when raising an existing bid. */
  payableCents: number;
  /** The total bid the listing ends up holding. */
  amountCents: number;
  resultingRank: number;
}

/**
 * Prices a bid.
 *
 * - A new listing pays its full amount.
 * - An existing listing pays only the difference between its current bid and the new one.
 *   Someone else cannot seize that rank by paying the same difference — they'd be
 *   quoted against a base of 0.
 */
export function quoteBid({
  existingListing,
  newAmountCents,
  listings,
}: QuoteInput): Quote {
  const errors: QuoteErrorCode[] = [];

  if (!Number.isFinite(newAmountCents)) errors.push("not_a_number");
  else {
    if (!Number.isInteger(newAmountCents) || newAmountCents % INCREMENT_CENTS !== 0) {
      errors.push("not_a_whole_dollar");
    }
    if (newAmountCents < MIN_BID_CENTS) errors.push("below_minimum");
    if (newAmountCents > MAX_BID_CENTS) errors.push("above_maximum");
    if (existingListing && newAmountCents <= existingListing.amountCents) {
      errors.push("not_higher_than_current");
    }
  }

  const base = existingListing?.amountCents ?? 0;
  const payableCents = Math.max(0, newAmountCents - base);

  return {
    ok: errors.length === 0,
    errors,
    payableCents,
    amountCents: newAmountCents,
    resultingRank: previewRank(newAmountCents, listings, {
      excludeListingId: existingListing?.id,
    }),
  };
}

/**
 * A takeover costs double the current #1, floored so an empty board still has a
 * price and clamped so the doubling can never exceed what the column can hold.
 */
export function takeoverPriceCents(topCents: number): number {
  const doubled = Math.max(MIN_BID_CENTS * TAKEOVER_MULTIPLIER, topCents * TAKEOVER_MULTIPLIER);
  return Math.min(doubled, MAX_BID_CENTS * TAKEOVER_MULTIPLIER);
}

export function takeoverEndsAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() + TAKEOVER_HOURS * 60 * 60 * 1000);
}

export function isTakeoverActive(
  takeover: { endsAt: Date } | null | undefined,
  now: Date = new Date(),
): boolean {
  return !!takeover && takeover.endsAt.getTime() > now.getTime();
}

/**
 * Applies an active takeover to the sorted board.
 *
 * The takeover listing is pinned to #1 and the rest of page 1 is restored to the
 * order snapshotted when the takeover started, so nobody can buy their way onto
 * the first page for the duration. Everything else keeps its natural order behind it.
 */
export function applyTakeover<T extends RankableListing>(
  sorted: readonly T[],
  takeover: ActiveTakeover | null | undefined,
  now: Date = new Date(),
): T[] {
  if (!isTakeoverActive(takeover, now) || !takeover) return [...sorted];

  const byId = new Map(sorted.map((l) => [l.id, l]));
  const pinned: T[] = [];
  const seen = new Set<string>();

  const winner = byId.get(takeover.listingId);
  if (winner) {
    pinned.push(winner);
    seen.add(winner.id);
  }

  for (const id of takeover.frozenIds) {
    if (seen.has(id) || pinned.length >= PAGE_SIZE) continue;
    const listing = byId.get(id);
    if (listing) {
      pinned.push(listing);
      seen.add(id);
    }
  }

  const rest = sorted.filter((l) => !seen.has(l.id));
  return [...pinned, ...rest];
}

export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

export function clampPage(page: number, count: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), totalPages(count));
}
