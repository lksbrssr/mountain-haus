import { NextResponse } from "next/server";
import { ACCESS_COOKIE, tokenFor } from "@/lib/auth";

export async function POST(req: Request) {
  const { password, from } = await req.json().catch(() => ({}));
  const expected = process.env.SITE_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const redirect = typeof from === "string" && from.startsWith("/") ? from : "/";
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(ACCESS_COOKIE, await tokenFor(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
