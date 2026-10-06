import Image from "next/image";
import Link from "next/link";
import { house } from "@/lib/house";
import { rooms } from "@/lib/rooms";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
        <Image
          src={house.heroImage}
          alt={house.name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/70" />
        <SiteHeader light />
        <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-16">
          <div className="mx-auto w-full max-w-6xl">
            <p className="rise mb-4 font-sans text-sm uppercase tracking-[0.25em] text-cream/80">
              {house.location}
            </p>
            <h1 className="rise-2 max-w-3xl font-display text-5xl leading-[1.05] text-cream sm:text-7xl">
              {house.tagline}
            </h1>
            <p className="rise-3 mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
              {house.blurb}
            </p>
            <div className="rise-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="#rooms"
                className="rounded-full bg-cream px-6 py-3 text-sm font-medium text-forest transition hover:bg-white"
              >
                Choose a room
              </Link>
              <Link
                href="#rooms"
                className="rounded-full border border-cream/40 px-6 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
              >
                Everything's free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intro strip */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Swim before breakfast", "The jetty is thirty seconds from the door. Cold, clear, and yours."],
            ["Four rooms, no front desk", "Pick the room that suits you. Send a request. We'll confirm by email."],
            ["On the house", "This isn't a hotel. There's no bill — just tell us when you'd like to come."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-display text-xl text-forest">{title}</h3>
              <p className="mt-2 leading-relaxed text-pine/90">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms */}
      <section id="rooms" className="bg-sand/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
                The rooms
              </p>
              <h2 className="mt-2 font-display text-4xl text-forest">
                Where would you like to sleep?
              </h2>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {rooms.map((room, i) => (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                className="group block overflow-hidden rounded-3xl bg-cream shadow-soft transition hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={room.images[0]}
                    alt={room.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-xs font-medium text-forest">
                    Sleeps {room.sleeps}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <h3 className="font-display text-2xl text-forest">{room.name}</h3>
                    <p className="mt-1 text-pine/90">{room.short}</p>
                    <p className="mt-3 text-sm text-clay">
                      {room.size} · {room.bed} · {room.view}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-forest transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
