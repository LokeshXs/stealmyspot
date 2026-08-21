import Link from "next/link";
import { branding } from "@/lib/env";

/**
 * The only navigation on the page. Rules moved down here so the masthead has
 * nothing competing with the wordmark and the live badge.
 */
export function SiteFooter() {
  return (
    <footer className="rule-t mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-xs text-muted-foreground">
      <span className="font-bold text-foreground">
        {branding.name}
        {branding.tld}
      </span>

      <nav aria-label="Site" className="flex items-center gap-x-5">
        <Link href="/rules" className="font-medium transition-colors hover:text-foreground">
          Rules
        </Link>
        <Link href="/stats" className="font-medium transition-colors hover:text-foreground">
          See Stats
        </Link>
      </nav>

      <span className="ml-auto text-[11px]">Positions are bought, not earned.</span>
    </footer>
  );
}
