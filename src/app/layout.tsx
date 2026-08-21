import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { canonicalOrigin } from "@/lib/env";
import { HOME_DESCRIPTION, HOME_TITLE, pageMetadata } from "@/lib/seo";
import "./globals.css";

// One family for everything. Inter Tight carries 400 through 900, and its
// tabular numerals keep the money columns aligned without a second font file.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  ...pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" }),
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e13" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${interTight.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
        <Script
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
          data-website-id="3715c31e-24ad-4bff-a252-44cf55f87453"
        />
      </body>
    </html>
  );
}
