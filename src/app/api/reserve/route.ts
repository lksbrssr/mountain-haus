import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { reference, maxBookingDateISO, todayISO } from "@/lib/format";
import { RESERVATIONS_TAG } from "@/lib/reservations";

export const maxDuration = 60;

type Payload = {
  slug: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Payload | null;

  if (!body || !body.name || !body.email || !body.checkIn || !body.checkOut) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // Dates must be sane: check-out after check-in, not in the past, and no more
  // than two years out.
  const today = todayISO();
  const maxDate = maxBookingDateISO();
  if (body.checkOut <= body.checkIn) {
    return NextResponse.json({ ok: false, error: "Check-out must be after check-in" }, { status: 400 });
  }
  if (body.checkIn < today) {
    return NextResponse.json({ ok: false, error: "Check-in can't be in the past" }, { status: 400 });
  }
  if (body.checkOut > maxDate) {
    return NextResponse.json(
      { ok: false, error: "We can only take bookings up to two years ahead" },
      { status: 400 },
    );
  }

  const ref = reference();
  const record = {
    reference: ref,
    submittedAt: new Date().toISOString(),
    room: body.roomName,
    slug: body.slug,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    nights: body.nights,
    guests: body.guests,
    name: body.name,
    email: body.email,
    phone: body.phone ?? "",
    notes: body.notes ?? "",
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
      // New booking written — refresh the cached reservations immediately so the
      // calendar / availability / who's-coming reflect it right away.
      revalidateTag(RESERVATIONS_TAG);
    } catch (err) {
      // Don't lose the request: log it so it's recoverable from Vercel logs.
      console.error("Failed to write reservation to sheet:", err);
      console.log("RESERVATION (unsaved):", JSON.stringify(record));
      return NextResponse.json(
        { ok: false, error: "Could not save request" },
        { status: 502 },
      );
    }
  } else {
    // No sheet wired up yet — still succeed, but log it.
    console.log("RESERVATION (no webhook configured):", JSON.stringify(record));
  }

  return NextResponse.json({ ok: true, reference: ref });
}
