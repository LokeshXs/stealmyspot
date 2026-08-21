import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: appUrl, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${appUrl}/rules`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/stats`, lastModified: now, changeFrequency: "hourly", priority: 0.5 },
  ];
}
