import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PresenceTracker } from "@/components/presence-tracker";
import { appUrl, branding, siteTitle } from "@/lib/env";
import "./globals.css";

// Three roles: a masthead face, a UI face, and a tabular face for money.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${instrumentSerif.variable} ${interTight.variable} ${plexMono.variable} h-full antialiased`}
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
