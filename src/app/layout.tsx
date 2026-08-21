import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PresenceTracker } from "@/components/presence-tracker";
import { appUrl, branding, siteTitle } from "@/lib/env";
import "./globals.css";

// One family for everything. Inter Tight carries 400 through 900, and its
// tabular numerals keep the money columns aligned without a second font file.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const description = `${branding.tagline} ${branding.taglineEmphasis}`;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: siteTitle,
  description,
  openGraph: {
    title: siteTitle,
    description,
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${interTight.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          {children}
          <PresenceTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
