import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { WalletButton } from "@/components/WalletButton";
import { CLUSTER } from "@/lib/config";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proof of Call",
  description: "Market calls committed on Solana before the move. Audited track records, pay-per-call via x402.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
            <nav className="mx-auto flex max-w-5xl items-center gap-5 px-4 py-3 text-sm">
              <Link href="/" className="font-semibold tracking-tight">
                Proof<span className="text-accent">of</span>Call
              </Link>
              <Link href="/" className="text-muted hover:text-foreground">Feed</Link>
              <Link href="/new" className="text-muted hover:text-foreground">New call</Link>
              <Link href="/topup" className="text-muted hover:text-foreground">Top up</Link>
              <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted">
                {CLUSTER}
              </span>
              <WalletButton />
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>{children}</Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
