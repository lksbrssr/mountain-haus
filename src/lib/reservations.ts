import { unstable_cache } from "next/cache";

// Reads reservations back from the Google Sheet (via the Apps Script doGet).
// Only non-sensitive fields are returned — first name, room, dates, guest count.
// Email / phone / notes never leave the sheet.
//
// Apps Script web apps can be slow and very variable (1s … 40s+), so we:
//   - cache the result for 60s (Vercel Data Cache, shared across requests), and
//   - abort any single fetch after 30s so a page can never hang.
// A new booking calls revalidateTag("reservations") so the cache refreshes at once.

export type PublicReservation = {
  name: string;
  room: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export const RESERVATIONS_TAG = "reservations";

async function fetchFromSheet(): Promise<PublicReservation[]> {
  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) return [];

  const url = new URL(webhook);
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (secret) url.searchParams.set("secret", secret);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
  const data = await res.json();

  return (data.reservations || [])
    .map((r: Record<string, unknown>) => ({
      name: String(r.name ?? "Guest").trim().split(/\s+/)[0] || "Guest",
      room: String(r.room ?? ""),
      checkIn: String(r.checkIn ?? "").slice(0, 10),
      checkOut: String(r.checkOut ?? "").slice(0, 10),
      guests: Number(r.guests) || 1,
    }))
    .filter((r: PublicReservation) => r.checkIn && r.checkOut);
}

const getCached = unstable_cache(fetchFromSheet, ["reservations-v1"], {
  revalidate: 60,
  tags: [RESERVATIONS_TAG],
});

export async function getReservations(): Promise<PublicReservation[]> {
  try {
    return await getCached();
  } catch (err) {
    // Timeout or sheet error — fail soft to "no bookings" rather than hang.
    console.error("Failed to read reservations:", err);
    return [];
  }
}
