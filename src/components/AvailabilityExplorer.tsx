"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Room } from "@/lib/rooms";
import type { PublicReservation } from "@/lib/reservations";
import { nightsBetween, rangesOverlap } from "@/lib/format";
import { RoomImage } from "@/components/RoomImage";

type Status = "idle" | "free" | "taken" | "toosmall" | "construction";

export function AvailabilityExplorer({ rooms }: { rooms: Room[] }) {
  const [checkIn] = useState("");
  const [checkOut] = useState("");
  const [guests] = useState(2);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]));
  }, []);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const hasDates = nights > 0;

  function statusFor(room: Room): Status {
    if (room.underConstruction) return "construction";
    if (!hasDates) return "idle";
    if (room.sleeps < guests) return "toosmall";
    const taken = reservations.some(
      (r) => r.room === room.name && rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut),
    );
    return taken ? "taken" : "free";
  }

  const query = new URLSearchParams({ in: checkIn, out: checkOut, guests: String(guests) }).toString();

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Rooms intro + calendar button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">The rooms</p>
          <h2 className="mt-2 font-display text-4xl text-forest">Where you&apos;ll stay</h2>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-pine"
        >
          🗓 View the booking calendar →
        </Link>
      </div>

      {/* Rooms */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const status = statusFor(room);
          const bookable = status === "free";
          const dimmed = status === "taken" || status === "toosmall" || status === "construction";
          const href = bookable
            ? `/rooms/${room.slug}/book?${query}`
            : `/rooms/${room.slug}`;

          return (
            <Link
              key={room.slug}
              href={href}
              className={`group block overflow-hidden rounded-3xl bg-cream shadow-soft transition hover:-translate-y-1 ${
                dimmed ? "opacity-80" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <RoomImage
                  src={room.images[0]}
                  alt={room.name}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
                {dimmed && <div className="absolute inset-0 bg-cream/55" />}

                <span className="absolute left-4 top-4 z-10 rounded-full bg-cream/90 px-3 py-1 text-xs font-medium text-forest">
                  Sleeps {room.sleeps}
                </span>

                {status === "free" && (
                  <span className="absolute right-4 top-4 z-10 rounded-full bg-lake px-3 py-1 text-xs font-medium text-cream">
                    Free for your dates
                  </span>
                )}
                {status === "taken" && (
                  <span className="absolute right-4 top-4 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-cream">
                    Booked for these dates
                  </span>
                )}
                {status === "toosmall" && (
                  <span className="absolute right-4 top-4 z-10 rounded-full bg-ink/60 px-3 py-1 text-xs font-medium text-cream">
                    Too small for {guests}
                  </span>
                )}
                {status === "construction" && (
                  <span className="absolute right-4 top-4 z-10 rounded-full bg-clay px-3 py-1 text-xs font-medium text-cream">
                    🚧 Under construction
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 p-6">
                <div>
                  <h3 className="font-display text-2xl text-forest">{room.name}</h3>
                  <p className="mt-1 text-pine/90">{room.short}</p>
                  <p className="mt-3 text-sm text-clay">
                    {room.size} · {room.bed} · {room.view}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-sm text-forest transition group-hover:translate-x-1">
                  {bookable ? "Request →" : status === "construction" ? "Take a peek →" : "View →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
