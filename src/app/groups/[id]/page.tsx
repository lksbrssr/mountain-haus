import Link from "next/link";
import type { Metadata } from "next";
import { house } from "@/lib/house";
import { SiteFooter } from "@/components/Chrome";
import { GroupClient } from "./GroupClient";

export const metadata: Metadata = {
  title: `Group booking — ${house.name}`,
};

export default function GroupPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <header className="border-b border-clay/25 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight text-forest">
            {house.name}
          </Link>
          <nav className="flex items-center gap-6 text-sm text-forest">
            <Link
              href="/groups"
              className="opacity-80 transition hover:opacity-100"
            >
              ← All groups
            </Link>
            <span className="rounded-full bg-forest px-4 py-2 text-sm text-cream">
              Group booking
            </span>
          </nav>
        </div>
      </header>

      <GroupClient id={params.id} />

      <SiteFooter />
    </main>
  );
}
