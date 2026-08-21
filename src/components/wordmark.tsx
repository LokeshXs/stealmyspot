import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { splitBrandName } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * The mark plus the name, with the trailing word carrying the accent. Both
 * halves come from `splitBrandName()`, so the footer and the social card render
 * exactly the same lockup.
 */
export function Wordmark({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  const { lead, accent } = splitBrandName();

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 font-black tracking-[-0.045em]",
        size === "lg" ? "text-2xl" : "text-xl",
        className,
      )}
    >
      <LogoMark
        className={cn(
          "shrink-0 text-foreground transition-transform group-hover:-translate-y-0.5",
          size === "lg" ? "size-6" : "size-5",
        )}
      />
      <span className="whitespace-nowrap">
        {lead}
        <span className="text-primary">{accent}</span>
      </span>
    </Link>
  );
}
