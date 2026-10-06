"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Room } from "@/lib/rooms";
import type { PublicReservation } from "@/lib/reservations";
import { nightsBetween, prettyRange, rangesOverlap, maxBookingDateISO } from "@/lib/format";
import { RoomImage } from "@/components/RoomImage";

type Status = "idle" | "free" | "taken" | "toosmall";

export function AvailabilityExplorer({ rooms }: { rooms: Room[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = maxBookingDateISO();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]));
  }, []);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const hasDates = nights > 0;
  const maxSleeps = Math.max(...rooms.map((r) => r.sleeps));

  function statusFor(room: Room): Status {
    if (!hasDates) return "idle";
    if (room.sleeps < guests) return "toosmall";
    const taken = reservations.some(
      (r) => r.room === room.name && rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut),
    );
    return taken ? "taken" : "free";
  }

  const query = new URLSearchParams({ in: checkIn, out: checkOut, guests: String(guests) }).toString();
  const freeCount = hasDates ? rooms.filter((r) => statusFor(r) === "free").length : 0;

  const field =
    "mt-2 w-full rounded-xl border border-clay/40 bg-white px-4 py-3 text-forest outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/30";

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">Plan your stay</p>
      <h2 className="mt-2 font-display text-4xl text-forest">
        When would you like to come?
      </h2>
      <p className="mt-3 max-w-xl text-pine/90">
        Pick your dates and we&apos;ll show you which rooms are free. It&apos;s a request, not
        a payment — we&apos;ll confirm by email.
      </p>
      <Link href="/calendar" className="mt-2 inline-block text-sm text-lake underline">
        Prefer a timeline? See the full booking calendar →
      </Link>

      {/* Date search */}
      <div className="mt-8 rounded-3xl bg-cream p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-forest">Check in</label>
            <input
              type="date"
              min={today}
              max={maxDate}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-forest">Check out</label>
            <input
              type="date"
              min={checkIn || today}
              max={maxDate}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-forest">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className={field}
            >
              {Array.from({ length: maxSleeps }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            {hasDates ? (
              <p className="text-sm text-pine/80">
                <span className="font-medium text-forest">
                  {freeCount} {freeCount === 1 ? "room" : "rooms"} free
                </span>
                <br />
                {prettyRange(checkIn, checkOut)} · {nights} {nights === 1 ? "night" : "nights"}
              </p>
            ) : (
              <p className="text-sm text-pine/60">Showing all four rooms below.</p>
            )}
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {rooms.map((room) => {
          const status = statusFor(room);
          const bookable = status === "free";
          const dimmed = status === "taken" || status === "toosmall";
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
                  {bookable ? "Request →" : "View →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
