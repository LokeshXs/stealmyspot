import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is useful to a crawler and all of it is per-user.
      disallow: ["/api/", "/checkout/", "/success"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
