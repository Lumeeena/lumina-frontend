import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SkipLink from "@/components/SkipLink";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import WatchActivityWatcher from "@/components/WatchActivityWatcher";
import { shareCard } from "@/lib/metadata";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  // Relative URLs in any metadata field below are resolved against this, so a
  // canonical link or an og:image is never emitted as a bare path — which
  // crawlers and chat clients read as an invalid absolute URL.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Child routes state only their own name; the brand is appended here so a
    // shared tab reads "Explorer — Lumina" rather than one bare word.
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  // The defaults for any route that has not set its own. Every page here does
  // set its own, built by the same `shareCard` helper.
  ...shareCard({ label: SITE_TITLE, description: DEFAULT_DESCRIPTION, path: "/" }),
  // Every route here is a public, linkable view, so indexing is wanted
  // explicitly rather than left to the default. Per-address pages are kept out
  // of crawls by robots.txt, not out of the index.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#0e0e12]">
        <SkipLink />
        {/* Alerts for watched addresses have to keep arriving on every route,
            which is the whole point of a watch. It subscribes and records; it
            renders nothing. */}
        <WatchActivityWatcher />
        <Navbar />
        <KeyboardShortcuts />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
