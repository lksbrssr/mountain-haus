import Link from "next/link";
import type { Metadata } from "next";
import { house } from "@/lib/house";
import { SiteFooter } from "@/components/Chrome";
import { GroupsIndexClient } from "./GroupsIndexClient";

export const metadata: Metadata = {
  title: `Group booking — ${house.name}`,
  description:
    "Find a weekend that works for the whole group — drop your availability and join.",
};

export default function GroupsPage() {
  return (
    <main>
      <header className="border-b border-clay/25 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight text-forest">
            {house.name}
          </Link>
          <nav className="flex items-center gap-6 text-sm text-forest">
            <Link href="/" className="opacity-80 transition hover:opacity-100">
              ← Back to the haus
            </Link>
            <span className="rounded-full bg-forest px-4 py-2 text-sm text-cream">
              Group booking
            </span>
          </nav>
        </div>
      </header>

      <GroupsIndexClient />

      <SiteFooter />
    </main>
  );
}
