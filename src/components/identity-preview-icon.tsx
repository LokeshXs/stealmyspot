"use client";

import { useState } from "react";
import { GlobeIcon, Spinner } from "@/components/icons";
import type { ListingPreviewResponse } from "@/app/api/listing-preview/route";
import { cn } from "@/lib/utils";

export function IdentityPreviewIcon({
  preview,
  loading,
  className,
}: {
  preview: ListingPreviewResponse | null;
  loading: boolean;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (loading) return <Spinner className={cn("size-4", className)} />;
  if (preview?.imageUrl && preview.imageUrl !== failedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preview.imageUrl}
        alt=""
        decoding="async"
        onError={() => setFailedUrl(preview.imageUrl)}
        className={cn("size-4 rounded-sm object-cover", className)}
      />
    );
  }
  return <GlobeIcon className={className} />;
}
