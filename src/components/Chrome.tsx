import Link from "next/link";
import { house } from "@/lib/house";

export function SiteHeader({ light = false }: { light?: boolean }) {
  const tone = light ? "text-cream" : "text-forest";
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className={`font-display text-lg tracking-tight ${tone}`}>
          {house.name}
        </Link>
        <nav className={`flex items-center gap-6 text-sm ${tone}`}>
          <Link href="/#rooms" className="opacity-80 transition hover:opacity-100">
            Rooms
          </Link>
          <Link href="/#area" className="hidden opacity-80 transition hover:opacity-100 sm:inline">
            The area
          </Link>
          <Link href="/#house" className="hidden opacity-80 transition hover:opacity-100 sm:inline">
            Good to know
          </Link>
          <Link
            href="/#rooms"
            className={`rounded-full px-4 py-2 text-sm transition ${
              light
                ? "bg-cream/90 text-forest hover:bg-cream"
                : "bg-forest text-cream hover:bg-pine"
            }`}
          >
            Request a stay
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-clay/30 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-pine sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base text-forest">{house.name}</p>
        <p className="opacity-70">
          {house.location} · Every stay is on us — just send a request.
        </p>
      </div>
    </footer>
  );
}
