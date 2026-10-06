"use client";

import { useMemo, useState } from "react";
import { nightsBetween, prettyDate } from "@/lib/format";
import { RoomImage } from "@/components/RoomImage";

export function CheckoutForm({
  slug,
  roomName,
  sleeps,
  image,
}: {
  slug: string;
  roomName: string;
  sleeps: number;
  image?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (nights <= 0) {
      setError("Please pick a check-out date after your check-in date.");
      return;
    }
    setSubmitting(true);
    const form = e.currentTarget;
    const payload = {
      slug,
      roomName,
      checkIn,
      checkOut,
      nights,
      guests,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value,
    };

    const res = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { reference } = await res.json();
      const q = new URLSearchParams({
        ref: reference,
        room: roomName,
        in: checkIn,
        out: checkOut,
      });
      window.location.href = `/booked?${q.toString()}`;
    } else {
      setError("Something went wrong sending your request. Please try again.");
      setSubmitting(false);
    }
  }

  const field =
    "mt-2 w-full rounded-xl border border-clay/40 bg-white px-4 py-3 text-forest outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/30";

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-8 md:grid-cols-5">
      {/* Form */}
      <div className="space-y-6 md:col-span-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-forest">Check in</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className={field}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-forest">Check out</label>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-forest">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={field}
          >
            {Array.from({ length: sleeps }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-clay/30 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-forest">Your name</label>
              <input name="name" required className={field} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-sm font-medium text-forest">Phone</label>
              <input name="phone" className={field} placeholder="Optional" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-forest">Email</label>
            <input
              name="email"
              type="email"
              required
              className={field}
              placeholder="jane@example.com"
            />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-forest">
              Anything we should know?
            </label>
            <textarea
              name="notes"
              rows={3}
              className={field}
              placeholder="Arrival time, dietary notes, a dog, a birthday…"
            />
          </div>
        </div>
      </div>

      {/* Order summary */}
      <aside className="md:col-span-2">
        <div className="sticky top-6 overflow-hidden rounded-3xl bg-cream shadow-soft">
          <div className="relative h-32 w-full">
            <RoomImage src={image} alt={roomName} />
          </div>
          <div className="p-6">
            <h3 className="font-display text-xl text-forest">{roomName}</h3>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-pine/80">Check in</dt>
                <dd className="text-forest">{prettyDate(checkIn)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pine/80">Check out</dt>
                <dd className="text-forest">{prettyDate(checkOut)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pine/80">Guests</dt>
                <dd className="text-forest">{guests}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 border-t border-clay/30 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-pine/80">
                  €240 × {nights || 0} {nights === 1 ? "night" : "nights"}
                </dt>
                <dd className="text-forest">€{240 * (nights || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pine/80">House guest discount</dt>
                <dd className="text-lake">−€{240 * (nights || 0)}</dd>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-clay/30 pt-4">
              <span className="font-medium text-forest">Total</span>
              <span className="font-display text-3xl text-forest">Free</span>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-forest py-3 font-medium text-cream transition hover:bg-pine disabled:opacity-60"
            >
              {submitting ? "Sending request…" : "Send reservation request"}
            </button>
            <p className="mt-3 text-center text-xs text-pine/60">
              This is a request, not a confirmed booking. We'll email you back.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
