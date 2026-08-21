import Link from "next/link";
import { FAQS } from "@/lib/seo";

export function SeoContent() {
  return (
    <section aria-labelledby="field-guide-title" className="rule-t py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:gap-16">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
            Field guide
          </p>
          <h2
            id="field-guide-title"
            className="mt-3 max-w-xl text-3xl font-black tracking-[-0.03em] text-balance sm:text-4xl"
          >
            A paid place for products that want to be seen.
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
            <p>
              Steal My Spot is a live website promotion leaderboard for founders, makers, apps,
              and public profiles. Choose a number, submit your website or X handle, and the amount
              decides where it appears. There is no vote, editorial score, or hidden ranking
              formula: a higher settled bid stands above a lower one.
            </p>
            <p>
              You can list a public product homepage, an app-store page, a GitHub project, or an X
              profile. Short links are resolved and tracking parameters are removed before a listing
              is published. Chat invitations and adult material are not accepted. The complete
              eligibility and payment terms are set out in the{" "}
              <Link href="/rules" className="font-semibold text-foreground underline underline-offset-4">
                leaderboard rules
              </Link>
              .
            </p>
            <p>
              Every displayed position is paid placement, and outbound links are marked as
              sponsored. Buying a position can make a project easier for visitors here to discover,
              but it does not guarantee clicks, customers, backlinks, or search-engine rankings.
              Another bidder can move above you at any time by placing a larger number.
            </p>
          </div>
        </div>
        <div aria-labelledby="faq-title">
          <p id="faq-title" className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
            Common questions
          </p>
          <div className="mt-3 border-b border-[--rule]">
            {FAQS.map(({ question, answer }) => (
              <details key={question} className="group rule-t py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold marker:content-none">
                  <span>{question}</span>
                  <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-7 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
