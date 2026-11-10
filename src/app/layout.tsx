import type { Metadata, Viewport } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://sidodus.github.io/phonetic_word_replicator/"),
  title: "Phonetic Word Replicator — Know Your Phonetic Sound",
  description:
    "Learn spelling through IPA / X-SAMPA phonetic sounds in 8 languages. Classic spelling, multiple choice, listen & spell, speed challenge and a daily puzzle — with XP, streaks and achievements.",
  applicationName: "Phonetic Word Replicator",
  authors: [{ name: "Saheed Odulaja", url: "https://github.com/Sidodus" }],
  keywords: ["phonetics", "IPA", "X-SAMPA", "spelling", "pronunciation", "learning game"],
  openGraph: {
    siteName: "Phonetic Word Replicator",
    title: "Phonetic Word Replicator",
    description:
      "Train your ear, master your spelling — one sound at a time. 8 languages, 5 game modes.",
    images: ["/img/Phonetic-Word-Replicator(0).png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#16181d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
