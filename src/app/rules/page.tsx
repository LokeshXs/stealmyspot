import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { siteTitle } from "@/lib/env";
import { MIN_BID_CENTS, TAKEOVER_HOURS, TAKEOVER_MULTIPLIER } from "@/lib/ranking";

export const metadata: Metadata = { title: `Rules · ${siteTitle}` };

const minimum = MIN_BID_CENTS / 100;

function Num({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-foreground tabular-nums">{children}</span>;
}

function Clause({ children }: { children: React.ReactNode }) {
  return (
    <li className="rule-t py-3 text-sm leading-relaxed text-pretty text-muted-foreground">
      {children}
    </li>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{n}</span>
        <span className="font-display text-xl">{title}</span>
      </h2>
      <ul className="mt-2 border-b border-[--rule]">{children}</ul>
    </section>
  );
}

export default function RulesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 pb-12 sm:px-6">
      <header className="rule-masthead pb-3">
        <Wordmark size="sm" />
      </header>

      <h1 className="mt-10 font-display text-4xl">Rules</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
        This is a ledger, not a ranking of merit. Nobody is voted up and nothing is curated. A
        position is held by a number, and a larger number takes it.
      </p>

      <Section n="01" title="How position works">
        <Clause>
          Numbers are whole US dollars. The floor is <Num>${minimum}</Num> and every step above it
          is <Num>$1</Num>.
        </Clause>
        <Clause>
          You do not have to reach the top to appear. Whatever you put down buys the highest place
          it can afford, and the rest of the ledger shifts down around it.
        </Clause>
        <Clause>
          Two identical numbers do not compete — whichever arrived first stays above. Matching a
          number never takes a place; only exceeding one does.
        </Clause>
        <Clause>
          To lift an entry you already hold, submit the same address again with a larger number. You
          are charged the gap, not the whole amount. That discount is yours alone: anyone else
          reaching for the same place pays in full.
        </Clause>
        <Clause>
          Addresses on shared platforms — the App Store, Play Store, GitHub and their like — are
          told apart by their path, so two products on one host never collide.
        </Clause>
        <Clause>
          Reserving the front page costs <Num>{TAKEOVER_MULTIPLIER}×</Num> whatever stands at the
          top and freezes page one for <Num>{TAKEOVER_HOURS}</Num> hours. One reservation runs at a
          time, and later entries wait on page two until it lapses.
        </Clause>
      </Section>

      <Section n="02" title="What can be listed">
        <Clause>Something with a front door: a product on the web, or an X @handle.</Clause>
        <Clause>
          Not an invitation. Telegram, WhatsApp, Discord, Messenger, Signal and anything else that
          opens a conversation instead of a product will be turned away.
        </Clause>
        <Clause>Not adult material. Pornography and adult platforms have no place on the ledger.</Clause>
        <Clause>
          Everything after the question mark is discarded. Referral tags, affiliate codes and
          campaign parameters do not survive submission, so do not rely on them.
        </Clause>
        <Clause>
          Shortened links are unwound. Submit one and it is stored as whatever it actually points
          at — which is also what gets judged against the rules above.
        </Clause>
      </Section>

      <Section n="03" title="After payment">
        <Clause>
          Payment is what buys the place. Until it settles the entry is not public and holds no
          position.
        </Clause>
        <Clause>
          Readers reach the address exactly as submitted. We count the click on our side and add
          nothing to your URL.
        </Clause>
        <Clause>
          Dodo Payments handles the transaction as merchant of record and adds whatever tax your
          country requires. That tax is not part of your number — your place is set by the amount
          you entered, not the total you were charged.
        </Clause>
      </Section>

      <SiteFooter />
    </main>
  );
}
