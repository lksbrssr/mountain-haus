import Image from "next/image";
import Link from "next/link";
import { house } from "@/lib/house";
import { rooms } from "@/lib/rooms";
import { activities } from "@/lib/area";
import { houseInfo, wifi, stayTimes } from "@/lib/info";
import { AvailabilityExplorer } from "@/components/AvailabilityExplorer";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export default function Home() {
  const mapsEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(
    house.mapQuery,
  )}&z=14&output=embed`;
  const googleLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    house.mapQuery,
  )}`;
  const appleLink = `https://maps.apple.com/?q=${encodeURIComponent(house.mapQuery)}&ll=${house.lat},${house.lng}`;

  return (
    <main>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
        <Image
          src={house.heroImage}
          alt={house.name}
          fill
          priority
          className="object-cover object-[center_28%]"
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
                Check your dates
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
            ["Four rooms, no front desk", "Choose your dates and we'll show what's free. Send a request; we'll confirm by email."],
            ["On the haus", "This isn't a hotel. There's no bill — just tell us when you'd like to come."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-display text-xl text-forest">{title}</h3>
              <p className="mt-2 leading-relaxed text-pine/90">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms — dates-first availability */}
      <section id="rooms" className="bg-sand/50 py-20">
        <AvailabilityExplorer rooms={rooms} />
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

      {/* Where it is */}
      <section id="where" className="bg-sand/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
            Getting here
          </p>
          <h2 className="mt-2 font-display text-4xl text-forest">Where it is</h2>

          <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-3xl border border-clay/30 shadow-soft">
            <Image
              src="/birdseye.webp"
              alt="Bayrischzell in the valley below the Wendelstein"
              fill
              sizes="(min-width: 1152px) 1088px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            <p className="absolute bottom-4 left-5 text-sm text-cream/90">
              Bayrischzell, in the valley below the Wendelstein
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <p className="font-display text-2xl text-forest">{house.name}</p>
              <p className="mt-1 text-pine/90">{house.address}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-pine"
                >
                  Open in Google Maps
                </a>
                <a
                  href={appleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-forest/30 px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-forest/5"
                >
                  Open in Apple Maps
                </a>
              </div>

              <dl className="mt-8 space-y-4 border-t border-clay/30 pt-6 text-sm">
                <div>
                  <dt className="text-clay">From Munich</dt>
                  <dd className="mt-1 text-pine/90">
                    About 80 km / 1 hour by car — the A8 then the B307 up the valley.
                  </dd>
                </div>
                <div>
                  <dt className="text-clay">By train</dt>
                  <dd className="mt-1 text-pine/90">
                    BRB from München Hbf to Bayrischzell (~1h15), then a short walk or taxi.
                  </dd>
                </div>
                <div>
                  <dt className="text-clay">Parking</dt>
                  <dd className="mt-1 text-pine/90">Free, in the carport and beside the house.</dd>
                </div>
              </dl>
            </div>

            <div className="md:col-span-3">
              <div className="overflow-hidden rounded-3xl border border-clay/30 shadow-soft">
                <iframe
                  title={`Map to ${house.name}`}
                  src={mapsEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-[300px] w-full border-0 sm:h-[420px]"
                />
              </div>
            </div>
          </div>
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
