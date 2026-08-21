import Link from "next/link";
import { UMAMI_SHARE_URL } from "@/lib/analytics";
import { splitBrandName } from "@/lib/env";

/**
 * The only navigation on the page. Rules moved down here so the masthead has
 * nothing competing with the wordmark and the live badge.
 */
export function SiteFooter() {
  const { lead, accent } = splitBrandName();

  return (
    <footer className="rule-t mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-xs text-muted-foreground">
      <span className="font-bold text-foreground">
        {lead}
        <span className="text-primary">{accent}</span>
      </span>

      <nav aria-label="Site" className="flex items-center gap-x-5">
        <Link href="/rules" className="font-medium transition-colors hover:text-foreground">
          Rules
        </Link>
        <a
          href={UMAMI_SHARE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium transition-colors hover:text-foreground"
        >
          See Stats
        </a>
      </nav>

      <span className="text-[11px]">
        Built by{" "}
        <a
          href="https://x.com/ShipItLokesh"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
        >
          ShipItLokesh
        </a>
      </span>

      <span className="ml-auto text-[11px]">Positions are bought, not earned.</span>
    </footer>
  );
}
