import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PresenceTracker } from "@/components/presence-tracker";
import { appUrl, branding, siteTitle } from "@/lib/env";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
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
