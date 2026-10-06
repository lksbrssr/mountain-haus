import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { reference, maxBookingDateISO, todayISO } from "@/lib/format";
import { RESERVATIONS_TAG } from "@/lib/reservations";

export const maxDuration = 60;

const MAX_REQUESTS = 10;

type Booking = {
  slug: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
};
type Payload = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  bookings: Booking[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Payload | null;

  if (!body || !body.name || !body.email || !Array.isArray(body.bookings) || body.bookings.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing name, email, or bookings" }, { status: 400 });
  }
  if (body.bookings.length > MAX_REQUESTS) {
    return NextResponse.json(
      { ok: false, error: `Too many requests — the max is ${MAX_REQUESTS}.` },
      { status: 400 },
    );
  }

  const today = todayISO();
  const maxDate = maxBookingDateISO();
  for (const b of body.bookings) {
    if (!b.roomName || !b.checkIn || !b.checkOut) {
      return NextResponse.json({ ok: false, error: "A booking is missing room or dates" }, { status: 400 });
    }
    if (b.checkOut <= b.checkIn) {
      return NextResponse.json({ ok: false, error: "Check-out must be after check-in" }, { status: 400 });
    }
    if (b.checkIn < today) {
      return NextResponse.json({ ok: false, error: "A booking is in the past" }, { status: 400 });
    }
    if (b.checkOut > maxDate) {
      return NextResponse.json(
        { ok: false, error: "Bookings can only be up to two years ahead" },
        { status: 400 },
      );
    }
  }

  const submittedAt = new Date().toISOString();
  const bookings = body.bookings.map((b) => ({
    reference: reference(),
    room: b.roomName,
    slug: b.slug,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guests: b.guests,
  }));

  const record = {
    batch: true,
    submittedAt,
    name: body.name,
    email: body.email,
    phone: body.phone ?? "",
    notes: body.notes ?? "",
    bookings,
    secret: process.env.SHEETS_WEBHOOK_SECRET ?? "",
  };

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
      revalidateTag(RESERVATIONS_TAG);
    } catch (err) {
      console.error("Failed to write batch to sheet:", err);
      console.log("BATCH RESERVATION (unsaved):", JSON.stringify(record));
      return NextResponse.json({ ok: false, error: "Could not save your requests" }, { status: 502 });
    }
  } else {
    console.log("BATCH RESERVATION (no webhook configured):", JSON.stringify(record));
  }

  return NextResponse.json({ ok: true, references: bookings.map((b) => b.reference) });
}
