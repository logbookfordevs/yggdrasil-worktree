import type { Metadata } from "next";
import { Cinzel, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yggdrasil Worktree | Parallel Git Workflows for Modern Development",
  description: "Yggdrasil Worktree (yggtree) - An interactive CLI that turns Git worktrees into a first-class workflow. Like the mythical world tree, grow isolated parallel environments where ideas evolve independently.",
  keywords: ["git", "worktree", "cli", "developer tools", "parallel development", "ai agents", "workflow"],
  authors: [{ name: "LogBook for Devs", url: "https://logbookfordevs.com" }],
  openGraph: {
    title: "Yggdrasil Worktree | Parallel Git Workflows",
    description: "Turn Git worktrees into a first-class workflow. Grow many worlds. Merge what matters.",
    url: "https://yggtree.logbookfordevs.com",
    siteName: "Yggdrasil Worktree",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yggdrasil Worktree | Parallel Git Workflows",
    description: "Turn Git worktrees into a first-class workflow. Grow many worlds. Merge what matters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
