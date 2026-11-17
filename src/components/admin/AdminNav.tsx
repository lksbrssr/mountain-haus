"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { house } from "@/lib/house";

const items = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/calendar", label: "Kalender" },
  { href: "/admin/setup", label: "Einrichten" },
  { href: "/admin/systems", label: "Systeme" },
  { href: "/admin/appliances", label: "Geräte" },
  { href: "/admin/contacts", label: "Kontakte" },
  { href: "/admin/documents", label: "Dokumente" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-clay/25 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-lg tracking-tight text-forest">
            {house.name}
          </Link>
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-pine">
            Admin
          </span>
        </div>
        <nav className="-mx-1 flex flex-wrap items-center gap-1 text-sm">
          {items.map((it) => {
            const active =
              it.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active
                    ? "bg-forest text-cream"
                    : "text-pine hover:bg-forest/10 hover:text-forest"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-1 rounded-full px-3 py-1.5 text-pine/70 transition hover:text-forest"
          >
            ← Website
          </Link>
        </nav>
      </div>
    </header>
  );
}
