// Reads reservations back from the Google Sheet (via the Apps Script doGet).
// Only non-sensitive fields are returned — first name, room, dates, guest count.
// Email / phone / notes never leave the sheet.

export type PublicReservation = {
  name: string;
  room: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export async function getReservations(): Promise<PublicReservation[]> {
  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) return [];
  try {
    const url = new URL(webhook);
    const secret = process.env.SHEETS_WEBHOOK_SECRET;
    if (secret) url.searchParams.set("secret", secret);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
    const data = await res.json();

    return (data.reservations || [])
      .map((r: Record<string, unknown>) => ({
        // first name only, for a little privacy between guests
        name: String(r.name ?? "Guest").trim().split(/\s+/)[0] || "Guest",
        room: String(r.room ?? ""),
        checkIn: String(r.checkIn ?? "").slice(0, 10),
        checkOut: String(r.checkOut ?? "").slice(0, 10),
        guests: Number(r.guests) || 1,
      }))
      .filter((r: PublicReservation) => r.checkIn && r.checkOut);
  } catch (err) {
    console.error("Failed to read reservations:", err);
    return [];
  }
}
