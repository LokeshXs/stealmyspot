"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Square hairline tile. Falls back to a letter when the scraped og:image is
 * missing or 404s — a fair share of them do.
 */
export function Avatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = !!src && !failed;

  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 select-none overflow-hidden border border-border bg-muted",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {fallback}
        </span>
      )}
    </span>
  );
}
