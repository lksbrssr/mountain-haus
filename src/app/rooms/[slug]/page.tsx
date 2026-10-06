import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom, rooms } from "@/lib/rooms";
import { RoomImage } from "@/components/RoomImage";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export default function RoomPage({ params }: { params: { slug: string } }) {
  const room = getRoom(params.slug);
  if (!room) notFound();

  return (
    <main className="relative">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        <Link href="/#rooms" className="text-sm text-pine transition hover:text-forest">
          ← All rooms
        </Link>
      </div>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:col-span-3">
            <RoomImage src={room.images[0]} alt={room.name} priority />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:col-span-2">
            <RoomImage src={room.images[1]} alt={room.name} label="More photos soon" />
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
              Sleeps {room.sleeps} · {room.view}
            </p>
            <h1 className="mt-3 font-display text-5xl text-forest">{room.name}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pine/90">
              {room.description}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-y border-clay/30 py-6 text-sm">
              <div>
                <dt className="text-clay">Bed</dt>
                <dd className="mt-1 text-forest">{room.bed}</dd>
              </div>
              <div>
                <dt className="text-clay">Size</dt>
                <dd className="mt-1 text-forest">{room.size}</dd>
              </div>
              <div>
                <dt className="text-clay">View</dt>
                <dd className="mt-1 text-forest">{room.view}</dd>
              </div>
            </div>

            <h3 className="mt-8 font-display text-xl text-forest">In this room</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {room.amenities.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-clay/40 bg-cream px-4 py-1.5 text-sm text-pine"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Booking card */}
          <aside className="md:col-span-2">
            <div className="sticky top-6 rounded-3xl bg-cream p-7 shadow-soft">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl text-forest">Free</span>
                <span className="text-sm text-clay">On the house</span>
              </div>
              <p className="mt-1 text-sm text-pine/80">
                Our treat. Send a request and we'll confirm your dates.
              </p>
              <Link
                href={`/rooms/${room.slug}/book`}
                className="mt-5 block rounded-xl bg-forest py-3 text-center font-medium text-cream transition hover:bg-pine"
              >
                Request these dates
              </Link>
              <p className="mt-3 text-center text-xs text-pine/60">
                No card. No charge. Ever.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
