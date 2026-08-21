import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { siteTitle } from "@/lib/env";
import { MIN_BID_CENTS, TAKEOVER_HOURS, TAKEOVER_MULTIPLIER } from "@/lib/ranking";

export const metadata: Metadata = { title: `Rules · ${siteTitle}` };

const dollars = MIN_BID_CENTS / 100;

function Amount({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-primary tabular-nums">{children}</span>;
}

export default function RulesPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6 pb-16">
      <header className="text-center">
        <Wordmark size="sm" />
      </header>

      <h1 className="mt-10 text-3xl font-bold tracking-[-0.03em]">Rules</h1>
      <p className="mt-3 text-muted-foreground text-pretty">
        {siteTitle} is a public leaderboard. There are no ads, no API keys, and no revenue share.
        You pay to stand above everyone else. Rank is the bid — nothing else.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-[-0.02em]">How ranking works</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            Bids are whole US dollars, <Amount>${dollars}</Amount> minimum,{" "}
            <Amount>$1</Amount> at a time.
          </li>
          <li>
            Paying less than #1 still puts you on the board at whatever rank that bid can take.
            Equal bids stay in the order they were placed — the older bid keeps the higher rank.
          </li>
          <li>
            Enter the same website or @handle again to raise that listing back to #1. The new bid
            must be above your current one; you only pay the difference. Someone else cannot take
            your rank by paying that difference.
          </li>
          <li>
            App Store, Play Store, GitHub, and similar platform links are keyed by their path, so
            different apps don&apos;t share a bid. Tracking query strings are ignored.
          </li>
          <li>
            A leaderboard takeover costs <Amount>{TAKEOVER_MULTIPLIER}×</Amount> the current #1 and
            locks the first page for <Amount>{TAKEOVER_HOURS}</Amount> hours. Only one takeover can
            be live at a time.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-[-0.02em]">What you can list</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>A product website, or an X @handle.</li>
          <li>
            Chat and invite links are not allowed — Telegram, WhatsApp, Discord, Messenger, Signal,
            and similar. The board is for products and profiles, not group chats.
          </li>
          <li>
            Links to sexual content are not allowed. If it is porn, NSFW, or an adult platform, it
            does not belong on the board.
          </li>
          <li>
            Query parameters are stripped from listing links. Affiliate, referral, and tracking URLs
            will not work.
          </li>
          <li>
            Link shorteners are not allowed. If you submit one, it is replaced by the URL it
            redirects to.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-[-0.02em]">After you pay</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            Your listing is public. Clicks go to the URL or profile you submitted, without query
            parameters.
          </li>
          <li>A completed payment is what claims the rank.</li>
          <li>
            Payments are processed by Dodo Payments, which is the merchant of record and adds any
            applicable sales tax on top of your bid. Your rank is set by the bid, not the taxed
            total.
          </li>
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
