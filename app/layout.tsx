import type { Metadata } from "next";
import { Caveat, Inter, JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { RegisterServiceWorker } from "@/components/shell/RegisterServiceWorker";
import { WorkspaceProvider } from "@/components/workspace/store";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Landing-page only, so they load when used instead of being preloaded on every screen.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  preload: false,
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  preload: false,
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  preload: false,
  subsets: ["latin"],
  weight: "600",
});

// The public address of the deployed site. Link previews (LinkedIn, WhatsApp, X) need absolute URLs,
// so change this if the site moves to its own domain.
const SITE_URL = "https://network-ashen-two.vercel.app";
const TITLE = "NesT: Network Engagement & Signal Tracker";
const DESCRIPTION =
  "Understand your LinkedIn network, find the right people, write your own outreach and never miss a follow-up. Runs in your browser: your data never leaves your device.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · NesT" },
  description: DESCRIPTION,
  applicationName: "NesT",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NesT",
    title: "NesT: turn your LinkedIn connections into real opportunities",
    description: DESCRIPTION,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "NesT, Network Engagement & Signal Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NesT: turn your LinkedIn connections into real opportunities",
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${newsreader.variable} ${jakarta.variable} ${caveat.variable} h-full`}>
      <body className="h-full">
        <WorkspaceProvider>{children}</WorkspaceProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
