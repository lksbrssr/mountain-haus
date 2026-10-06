import { NextResponse } from "next/server";
import { getReservations } from "@/lib/reservations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const reservations = await getReservations();
  return NextResponse.json({ reservations });
}
