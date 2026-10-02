import type { Metadata } from "next";
import { Caveat, Inter, JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
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

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = {
  title: { default: "NesT", template: "%s · NesT" },
  description:
    "Understand your LinkedIn network, find the right people, prepare personalised outreach and never miss a follow-up. Local-first: your data stays in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${newsreader.variable} ${jakarta.variable} ${caveat.variable} h-full`}>
      <body className="h-full">
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
