import type { MetadataRoute } from "next";
import { canonicalOrigin } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${canonicalOrigin}/` }, { url: `${canonicalOrigin}/rules` }];
}
