"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Image avatar that quietly falls back to a letter tile — the board is full of
 * third-party og:image URLs, and a fair share of them 404.
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
        "relative flex shrink-0 select-none overflow-hidden rounded-md bg-muted",
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
        <span className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
          {fallback}
        </span>
      )}
    </span>
  );
}
