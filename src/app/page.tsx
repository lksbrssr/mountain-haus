import Image from "next/image";
import Link from "next/link";
import { house } from "@/lib/house";
import { rooms } from "@/lib/rooms";
import { activities } from "@/lib/area";
import { houseInfo, wifi, stayTimes } from "@/lib/info";
import { RoomImage } from "@/components/RoomImage";
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
                  <RoomImage
                    src={room.images[0]}
                    alt={room.name}
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-cream/90 px-3 py-1 text-xs font-medium text-forest">
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

      {/* What to do in the area */}
      <section id="area" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
          Around The Haus
        </p>
        <h2 className="mt-2 font-display text-4xl text-forest">
          What to do in the area
        </h2>
        <p className="mt-3 max-w-xl text-pine/90">
          Bayrischzell sits at the foot of the Wendelstein. A few of our
          favourites, a short drive or walk from the door.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {activities.map((a) => (
            <a
              key={a.title}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-5 rounded-3xl border border-clay/30 bg-cream p-6 transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="text-3xl">{a.emoji}</div>
              <div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-[0.18em] text-clay">
                  <span>{a.kind}</span>
                  <span className="opacity-50">·</span>
                  <span>{a.season}</span>
                </div>
                <h3 className="mt-1 font-display text-2xl text-forest">
                  {a.title}{" "}
                  <span className="inline-block text-lake transition group-hover:translate-x-1">
                    →
                  </span>
                </h3>
                <p className="mt-2 leading-relaxed text-pine/90">{a.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Good to know — house info */}
      <section id="house" className="bg-forest py-20 text-cream">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
            For guests
          </p>
          <h2 className="mt-2 font-display text-4xl">Good to know</h2>
          <p className="mt-3 max-w-xl text-cream/80">
            Everything you need while you're here. {house.address}.
          </p>

          {/* WiFi + times highlight */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-cream/10 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-cream/60">WiFi network</p>
              <p className="mt-2 font-display text-2xl">{wifi.network}</p>
            </div>
            <div className="rounded-3xl bg-cream/10 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-cream/60">WiFi password</p>
              <p className="mt-2 font-mono text-2xl">{wifi.password}</p>
            </div>
            <div className="rounded-3xl bg-cream/10 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-cream/60">Check in / out</p>
              <p className="mt-2 text-lg">
                In {stayTimes.checkIn}
                <br />
                Out {stayTimes.checkOut}
              </p>
            </div>
          </div>

          {/* Info cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {houseInfo.map((item) => (
              <div key={item.title} className="rounded-3xl bg-cream/10 p-6">
                <div className="text-2xl">{item.emoji}</div>
                <h3 className="mt-3 font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
