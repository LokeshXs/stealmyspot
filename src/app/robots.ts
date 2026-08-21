import type { MetadataRoute } from "next";
import { canonicalOrigin } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${canonicalOrigin}/sitemap.xml`,
  };
}
