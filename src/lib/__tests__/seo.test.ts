import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  FAQS,
  HOME_DESCRIPTION,
  HOME_TITLE,
  RULES_DESCRIPTION,
  RULES_TITLE,
  homeStructuredData,
  pageMetadata,
  serializeJsonLd,
} from "@/lib/seo";

describe("SEO metadata", () => {
  it("builds unique canonical metadata for public pages", () => {
    const home = pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" });
    const rules = pageMetadata({
      title: RULES_TITLE,
      description: RULES_DESCRIPTION,
      path: "/rules",
    });

    expect(home.title).not.toBe(rules.title);
    expect(home.description).not.toBe(rules.description);
    expect(home.alternates?.canonical).toBe("https://www.stealmyspot.lol/");
    expect(rules.alternates?.canonical).toBe("https://www.stealmyspot.lol/rules");
    expect(rules.openGraph).toMatchObject({ url: "https://www.stealmyspot.lol/rules" });
  });

  it("emits matching, safely serialized FAQ structured data", () => {
    const data = homeStructuredData();
    const serialized = serializeJsonLd(data);
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(data[2]).toMatchObject({ "@type": "FAQPage" });
    expect((data[2] as { mainEntity: unknown[] }).mainEntity).toHaveLength(FAQS.length);
    expect(serialized).toContain("https://www.stealmyspot.lol/");
  });
});

describe("crawler routes", () => {
  it("advertises only canonical public URLs", () => {
    expect(sitemap()).toEqual([
      { url: "https://www.stealmyspot.lol/" },
      { url: "https://www.stealmyspot.lol/rules" },
    ]);
  });

  it("blocks APIs while allowing noindex pages to be crawled", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://www.stealmyspot.lol/sitemap.xml",
    });
  });
});
