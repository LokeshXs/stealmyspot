import type { Metadata } from "next";
import { canonicalOrigin, siteTitle } from "@/lib/env";

export const HOME_TITLE = `Promote Your Website on a Live Leaderboard | ${siteTitle}`;
export const HOME_DESCRIPTION =
  "Place your website or X profile on a live paid leaderboard. Outbid another listing to claim a higher position and attract more visitors.";
export const RULES_TITLE = `Leaderboard Rules and Bidding | ${siteTitle}`;
export const RULES_DESCRIPTION =
  "Learn how bids determine leaderboard positions, which websites and profiles can be listed, and what happens after payment.";

export const FAQS = [
  {
    question: "How do I promote my website?",
    answer:
      "Choose a whole-dollar bid, enter your website address or X handle, and complete checkout. A settled payment places the entry at the highest position that amount can afford.",
  },
  {
    question: "How is leaderboard position calculated?",
    answer:
      "Higher bids rank above lower bids. When two bids are equal, the entry that reached that amount first stays above the newer one.",
  },
  {
    question: "How long does a position last?",
    answer:
      "A regular position has no fixed expiry, but another entry can move above it with a larger bid. A front-page reservation lasts for the period shown before checkout.",
  },
  {
    question: "Can I promote an X profile or app listing?",
    answer:
      "Yes. Public websites, X profiles, app-store listings, and public product pages are accepted. Chat invitations and adult content are not.",
  },
  {
    question: "Are clicks or traffic guaranteed?",
    answer:
      "No. A payment buys a leaderboard position, not a guaranteed number of clicks, customers, search rankings, or other results.",
  },
] as const;

export function canonicalUrl(path = "/"): string {
  return new URL(path, `${canonicalOrigin}/`).toString();
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = canonicalUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      locale: "en_US",
      type: "website",
      url,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function homeStructuredData() {
  const home = canonicalUrl("/");
  return [
    { "@context": "https://schema.org", "@type": "WebSite", name: siteTitle, url: home },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteTitle,
      url: home,
      logo: canonicalUrl("/logo-icon.png"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
