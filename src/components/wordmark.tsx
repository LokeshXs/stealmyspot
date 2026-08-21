import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { branding } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * The mark carries the accent colour; the name stays ink. Both halves read from
 * env, so dropping in the real name is a one-line change.
 */
export function Wordmark({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-baseline gap-2 font-display tracking-[-0.02em]",
        size === "lg" ? "text-[26px]" : "text-xl",
        className,
      )}
    >
      <LogoMark
        className={cn(
          "translate-y-[3px] text-foreground transition-opacity group-hover:opacity-80",
          size === "lg" ? "size-6" : "size-5",
        )}
      />
      <span>
        {branding.name}
        <span className="text-muted-foreground">{branding.tld}</span>
      </span>
    </Link>
  );
}
