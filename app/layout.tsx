import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "NetLens — Network Intelligence & Outreach",
  description:
    "Understand your LinkedIn network, find the right people, prepare personalised outreach and never miss a follow-up. Local-first: your data stays in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="h-full">
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
