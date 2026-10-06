import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, tokenFor } from "@/lib/auth";

// Gate everything except the unlock page, the unlock API, and static assets.
export const config = {
  matcher: ["/((?!unlock|api/unlock|_next|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  // If no password is configured, don't lock anyone out.
  if (!password) return NextResponse.next();

  const expected = await tokenFor(password);
  const got = req.cookies.get(ACCESS_COOKIE)?.value;
  if (got === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
