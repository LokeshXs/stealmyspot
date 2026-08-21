import { describe, expect, it } from "vitest";
import {
  MAX_BID_CENTS,
  MIN_BID_CENTS,
  applyTakeover,
  clampPage,
  nextTopBidCents,
  previewRank,
  quoteBid,
  sortBoard,
  takeoverPriceCents,
  topBidCents,
  totalPages,
  type RankableListing,
} from "../ranking";

const at = (iso: string) => new Date(iso);

function listing(id: string, dollars: number, iso: string): RankableListing {
  return { id, amountCents: dollars * 100, rankedAt: at(iso) };
}

describe("sortBoard", () => {
  it("orders by amount descending", () => {
    const board = sortBoard([
      listing("a", 5, "2026-01-01T00:00:00Z"),
      listing("b", 50, "2026-01-01T00:00:00Z"),
      listing("c", 1, "2026-01-01T00:00:00Z"),
    ]);
    expect(board.map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("breaks ties in favour of the older bid", () => {
    const board = sortBoard([
      listing("newer", 10, "2026-01-02T00:00:00Z"),
      listing("older", 10, "2026-01-01T00:00:00Z"),
    ]);
    expect(board.map((l) => l.id)).toEqual(["older", "newer"]);
  });

  it("stays deterministic when amount and timestamp both tie", () => {
    const a = listing("aaa", 10, "2026-01-01T00:00:00Z");
    const b = listing("bbb", 10, "2026-01-01T00:00:00Z");
    expect(sortBoard([b, a]).map((l) => l.id)).toEqual(["aaa", "bbb"]);
    expect(sortBoard([a, b]).map((l) => l.id)).toEqual(["aaa", "bbb"]);
  });

  it("does not mutate its input", () => {
    const input = [listing("a", 1, "2026-01-01T00:00:00Z"), listing("b", 9, "2026-01-01T00:00:00Z")];
    sortBoard(input);
    expect(input.map((l) => l.id)).toEqual(["a", "b"]);
  });
});

describe("nextTopBidCents", () => {
  it("opens an empty board at the $1 minimum", () => {
    expect(nextTopBidCents(0)).toBe(MIN_BID_CENTS);
    expect(nextTopBidCents(0)).toBe(100);
  });

  it("is a dollar above the current leader", () => {
    expect(nextTopBidCents(1_000_000)).toBe(1_000_100);
  });
});

describe("previewRank", () => {
  const board = [
    listing("a", 100, "2026-01-01T00:00:00Z"),
    listing("b", 50, "2026-01-01T00:00:00Z"),
    listing("c", 10, "2026-01-01T00:00:00Z"),
  ];

  it("places a top bid at #1", () => {
    expect(previewRank(101 * 100, board)).toBe(1);
  });

  it("places a low bid mid-board", () => {
    expect(previewRank(20 * 100, board)).toBe(3);
  });

  it("ranks an equal bid below the incumbent", () => {
    expect(previewRank(100 * 100, board)).toBe(2);
  });

  it("lands last when it is the cheapest", () => {
    expect(previewRank(100, board)).toBe(4);
  });

  it("ignores the listing being raised", () => {
    // 'b' raising to $60 should be #2, not #3 — its own old row must not block it.
    expect(previewRank(60 * 100, board, { excludeListingId: "b" })).toBe(2);
  });
});

describe("quoteBid", () => {
  const board = [listing("a", 100, "2026-01-01T00:00:00Z")];

  it("charges a new listing the full amount", () => {
    const quote = quoteBid({ newAmountCents: 101 * 100, listings: board });
    expect(quote.ok).toBe(true);
    expect(quote.payableCents).toBe(101 * 100);
    expect(quote.resultingRank).toBe(1);
  });

  it("charges an existing listing only the difference", () => {
    const existing = listing("a", 100, "2026-01-01T00:00:00Z");
    const quote = quoteBid({
      existingListing: existing,
      newAmountCents: 150 * 100,
      listings: board,
    });
    expect(quote.ok).toBe(true);
    expect(quote.payableCents).toBe(50 * 100);
    expect(quote.amountCents).toBe(150 * 100);
    expect(quote.resultingRank).toBe(1);
  });

  it("rejects a raise that is not above the current bid", () => {
    const existing = listing("a", 100, "2026-01-01T00:00:00Z");
    const quote = quoteBid({
      existingListing: existing,
      newAmountCents: 100 * 100,
      listings: board,
    });
    expect(quote.ok).toBe(false);
    expect(quote.errors).toContain("not_higher_than_current");
  });

  it("rejects above the maximum", () => {
    const quote = quoteBid({ newAmountCents: MAX_BID_CENTS + 100, listings: [] });
    expect(quote.ok).toBe(false);
    expect(quote.errors).toContain("above_maximum");
  });

  it("accepts exactly the maximum", () => {
    expect(quoteBid({ newAmountCents: MAX_BID_CENTS, listings: [] }).ok).toBe(true);
  });

  it("rejects below the $1 minimum", () => {
    expect(quoteBid({ newAmountCents: 0, listings: [] }).errors).toContain("below_minimum");
    expect(quoteBid({ newAmountCents: 50, listings: [] }).errors).toContain("below_minimum");
  });

  it("rejects fractional dollars", () => {
    expect(quoteBid({ newAmountCents: 150, listings: [] }).errors).toContain(
      "not_a_whole_dollar",
    );
  });

  it("accepts exactly $1 on an empty board", () => {
    const quote = quoteBid({ newAmountCents: MIN_BID_CENTS, listings: [] });
    expect(quote.ok).toBe(true);
    expect(quote.payableCents).toBe(100);
    expect(quote.resultingRank).toBe(1);
  });

  it("does not let a stranger buy a rank for the difference", () => {
    // Someone else bidding $150 against a $100 leader pays the full $150, not $50.
    const quote = quoteBid({ newAmountCents: 150 * 100, listings: board });
    expect(quote.payableCents).toBe(150 * 100);
  });
});

describe("takeoverPriceCents", () => {
  it("is double the current #1", () => {
    expect(takeoverPriceCents(10_000 * 100)).toBe(20_000 * 100);
  });

  it("has a floor so an empty board still has a price", () => {
    expect(takeoverPriceCents(0)).toBe(200);
  });

  /*
   * `amountCents` is a 32-bit Postgres integer. Doubling an unclamped top bid
   * is how a legal bid produces an out-of-range write on a path the bidder
   * never chose, so the ceiling has to survive the multiplier.
   */
  it("never exceeds what the amountCents column can hold", () => {
    const INT32_MAX = 2_147_483_647;
    for (const top of [0, MIN_BID_CENTS, MAX_BID_CENTS, MAX_BID_CENTS * 1000, INT32_MAX]) {
      expect(takeoverPriceCents(top)).toBeLessThanOrEqual(INT32_MAX);
    }
  });

  it("clamps a top bid that would otherwise double past the ceiling", () => {
    expect(takeoverPriceCents(MAX_BID_CENTS * 5)).toBe(MAX_BID_CENTS * 2);
  });
});

describe("applyTakeover", () => {
  const sorted = sortBoard([
    listing("a", 100, "2026-01-01T00:00:00Z"),
    listing("b", 50, "2026-01-01T00:00:00Z"),
    listing("c", 10, "2026-01-01T00:00:00Z"),
  ]);
  const now = at("2026-01-01T01:00:00Z");

  it("pins the takeover listing to #1 and freezes the snapshot behind it", () => {
    const out = applyTakeover(
      sorted,
      { listingId: "c", endsAt: at("2026-01-01T03:00:00Z"), frozenIds: ["a", "b"] },
      now,
    );
    expect(out.map((l) => l.id)).toEqual(["c", "a", "b"]);
  });

  it("keeps a later big bid off the frozen page", () => {
    const withWhale = sortBoard([...sorted, listing("whale", 9_999, "2026-01-01T00:30:00Z")]);
    const out = applyTakeover(
      withWhale,
      { listingId: "c", endsAt: at("2026-01-01T03:00:00Z"), frozenIds: ["a", "b"] },
      now,
    );
    expect(out.map((l) => l.id)).toEqual(["c", "a", "b", "whale"]);
  });

  it("is a no-op once the window has closed", () => {
    const out = applyTakeover(
      sorted,
      { listingId: "c", endsAt: at("2026-01-01T00:30:00Z"), frozenIds: ["a", "b"] },
      now,
    );
    expect(out.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("is a no-op when there is no takeover", () => {
    expect(applyTakeover(sorted, null, now).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("survives a frozen id whose listing has since vanished", () => {
    const out = applyTakeover(
      sorted,
      { listingId: "c", endsAt: at("2026-01-01T03:00:00Z"), frozenIds: ["ghost", "a"] },
      now,
    );
    expect(out.map((l) => l.id)).toEqual(["c", "a", "b"]);
  });
});

describe("pagination", () => {
  it("always has at least one page", () => {
    expect(totalPages(0)).toBe(1);
  });

  it("splits at 50 per page", () => {
    expect(totalPages(50)).toBe(1);
    expect(totalPages(51)).toBe(2);
    expect(totalPages(319)).toBe(7);
  });

  it("clamps out-of-range pages", () => {
    expect(clampPage(0, 100)).toBe(1);
    expect(clampPage(99, 100)).toBe(2);
    expect(clampPage(Number.NaN, 100)).toBe(1);
  });
});

describe("topBidCents", () => {
  it("is 0 for an empty board", () => {
    expect(topBidCents([])).toBe(0);
  });

  it("finds the maximum", () => {
    expect(topBidCents([listing("a", 3, "2026-01-01T00:00:00Z"), listing("b", 7, "2026-01-01T00:00:00Z")])).toBe(700);
  });
});
