import Link from "next/link";
import { rooms } from "@/lib/rooms";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { CalendarBoard } from "@/components/CalendarBoard";

export default function CalendarPage() {
  return (
    <main className="relative min-h-screen bg-sand/40">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <Link href="/" className="text-sm text-pine transition hover:text-forest">
          ← Home
        </Link>
        <h1 className="mt-4 font-display text-4xl text-forest sm:text-5xl">Calendar</h1>
        <p className="mt-3 max-w-xl text-pine/90">
          Booking status across all four rooms. Zoom from a single week out to the whole year,
          scroll to pan, and <strong className="font-semibold text-forest">drag across a room</strong>{" "}
          to request those nights.
        </p>
        <CalendarBoard rooms={rooms.map((r) => ({ slug: r.slug, name: r.name, sleeps: r.sleeps }))} />
      </div>
      <SiteFooter />
    </main>
  );
}
