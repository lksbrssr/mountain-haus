import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ADMIN_COOKIE,
  tokenFor,
  adminTokenFor,
} from "@/lib/auth";

// Gate everything except the unlock pages, their APIs, and static assets.
export const config = {
  matcher: [
    "/((?!unlock|admin/unlock|api/unlock|api/admin-unlock|_next|favicon.ico).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The /admin area has its own (optional) password, independent of the
  // guest site password — so you can share the house site without exposing
  // invoices, contacts and IBANs.
  if (pathname.startsWith("/admin")) {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (adminPw) {
      const expected = await adminTokenFor(adminPw);
      if (req.cookies.get(ADMIN_COOKIE)?.value === expected) {
        return NextResponse.next();
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/unlock";
      url.searchParams.set("from", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    // No admin password set → fall through to the site gate below.
  }

  const password = process.env.SITE_PASSWORD;
  // If no password is configured, don't lock anyone out.
  if (!password) return NextResponse.next();

  const expected = await tokenFor(password);
  const got = req.cookies.get(ACCESS_COOKIE)?.value;
  if (got === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("from", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}
