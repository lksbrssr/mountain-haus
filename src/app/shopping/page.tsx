import Link from "next/link";
import type { Metadata } from "next";
import { house } from "@/lib/house";
import { shoppingItems } from "@/lib/shopping";
import { SiteFooter } from "@/components/Chrome";
import { ShoppingClient } from "./ShoppingClient";

export const metadata: Metadata = {
  title: `Shopping — ${house.name}`,
  description: "Things we're planning to buy, or already have, for the haus.",
};

export default function ShoppingPage() {
  return (
    <main>
      {/* Minimal header */}
      <header className="border-b border-clay/25 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight text-forest">
            {house.name}
          </Link>
          <nav className="flex items-center gap-6 text-sm text-forest">
            <Link href="/" className="opacity-80 transition hover:opacity-100">
              ← Back to the haus
            </Link>
            <span className="rounded-full bg-forest px-4 py-2 text-sm text-cream">
              Shopping
            </span>
          </nav>
        </div>
      </header>

      <ShoppingClient items={shoppingItems} />

      <SiteFooter />
    </main>
  );
}
