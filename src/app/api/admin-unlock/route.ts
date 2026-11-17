import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminTokenFor } from "@/lib/auth";

export async function POST(req: Request) {
  const { password, from } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const redirect =
    typeof from === "string" && from.startsWith("/admin") ? from : "/admin";
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(ADMIN_COOKIE, await adminTokenFor(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
