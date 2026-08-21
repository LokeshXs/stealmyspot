# outbid

A pay-to-rank public ledger. There are no accounts, no ads, and no revenue share. **Your bid is your
rank.** Pay more than the standing top number and you hold first place; pay less and you take the
highest position that amount can afford.

---

## Quick start

```bash
pnpm install
docker compose up -d          # Postgres 17 on :5432
cp .env.example .env
pnpm prisma migrate dev
pnpm dev
```

The board opens **empty**, with #1 going for **$1**. `PAYMENT_PROVIDER=mock` is the default, so the
whole bid → pay → rank flow works with no Dodo account and no tunnel.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` | Next.js dev server / production build |
| `pnpm test` | Vitest unit suite for the ranking and identity rules |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Prisma Studio |
| `pnpm tsx scripts/inspect.ts` | Dump listings, bids and takeovers |
| `pnpm tsx scripts/seed-demo.ts 60` | Insert 60 fake listings to exercise pagination |
| `pnpm tsx scripts/reset.ts` | Wipe the board back to empty |
| `pnpm tsx scripts/test-webhook.ts <bidId>` | Post a correctly-signed Dodo webhook at the local app |

## How ranking works

All of it lives in [`src/lib/ranking.ts`](src/lib/ranking.ts) as pure functions, unit-tested in
[`src/lib/__tests__/ranking.test.ts`](src/lib/__tests__/ranking.test.ts).

- Order is `amountCents DESC, rankedAt ASC` — **equal bids keep placement order**, the older one wins.
- A new listing pays its full bid. Raising your own listing **pays only the difference**; a stranger
  bidding the same total pays the full amount, so nobody buys your rank for the delta.
- A **takeover** costs 2× the current #1, pins that listing at #1, and freezes the rest of page 1
  against a snapshot for 3 hours. New bids join from page 2 until the window closes.

Identity normalization ([`src/lib/identity.ts`](src/lib/identity.ts)) turns free text into a stable
key: query strings and `www.` are stripped, `x.com/foo` and `@Foo` collapse to `x:foo`, platform
hosts like `github.com` keep their path so two repos don't share a bid, and chat/adult links are
rejected while shorteners are resolved to their destination.

## Payments (Dodo)

Bids are arbitrary amounts, which rules out fixed-price products. Dodo supports this through a
**Pay What You Want** product whose price is set per checkout session.

**One-time dashboard setup:** create a one-time product ("Leaderboard rank"), pricing type
**Single Payment**, **Pay What You Want** on, **Minimum Price $1.00**. Put its `pdt_…` id in
`DODO_PRODUCT_ID`. Every bid of every size reuses that one product — the amount rides on
`product_cart[].amount` (in cents).

Then set `PAYMENT_PROVIDER=dodo`, fill in `DODO_PAYMENTS_API_KEY` and `DODO_PAYMENTS_WEBHOOK_KEY`,
and point the Dodo webhook at `<your-url>/api/webhooks/dodo` (locally: `ngrok http 3000`).

Three things the implementation is careful about:

1. **Rank comes from our own `bid.amountCents`, never the webhook's `total_amount`.** Dodo is the
   merchant of record and adds sales tax on top, so the charged total is not the bid. A $1 bid must
   show as `$1`, not `$1.19`.
2. **Only the webhook publishes a listing.** `return_url` can beat the webhook, so `/success` polls
   the bid and shows "confirming payment…" rather than claiming success.
3. **Deliveries are idempotent.** Dodo retries up to 8 times and may arrive out of order, so every
   delivery is recorded by its `webhook-id` header first; a repeat returns `200` and changes nothing.

## Design system — "editorial ledger"

The organising idea is a **public ledger of what people paid to be seen**, not a consumer-app
leaderboard. Structure comes from hairline rules and tabular numerals; nothing on the page carries a
soft shadow.

Every token lives in `:root` / `.dark` in [`src/app/globals.css`](src/app/globals.css) — violet on
cool slate, `--radius: 0.25rem`, plus `--rule` / `--rule-strong` for the ink-toned dividers and
`--accent-bar` for the leading row's margin marker. Token *names* mirror shadcn/ui, so swapping the
palette is a one-file change.

Three type roles, all via `next/font`: **Instrument Serif** for the masthead and headings,
**Inter Tight** for UI and body, **IBM Plex Mono** for money, ranks and anything tabular.

Layout is a masthead → dateline → two-column grid. The bid composer is first in source order so it
sits above the ledger on a phone, and `lg:order-2` swings it into a sticky right rail on desktop.
Board state lives in [`board-context.tsx`](src/components/board-context.tsx) so the composer and the
listing table can occupy sibling columns and still agree on the current ranks.

The name is still undecided, so branding is env-driven: `NEXT_PUBLIC_SITE_NAME`,
`NEXT_PUBLIC_SITE_TLD`, `NEXT_PUBLIC_TAGLINE`, `NEXT_PUBLIC_TAGLINE_EMPHASIS`. The logo mark is
deliberately name-agnostic.

## Notes

- **No user accounts**, same as the original. The submitted URL/@handle *is* the identity — anyone
  who re-submits it and pays the difference controls that listing.
- The mock checkout at `/checkout/[bidId]` and `/api/payments/mock/complete` hard-fail whenever
  `PAYMENT_PROVIDER !== "mock"`, so they can never publish a listing in production.
- The metadata scraper follows user-supplied URLs, so it re-resolves every redirect hop and rejects
  private address space (`src/lib/metadata.ts`).
- Refunds and disputes are recorded in `WebhookEvent` but not yet acted on — pulling a refunded
  listing off the board is the obvious next step.
