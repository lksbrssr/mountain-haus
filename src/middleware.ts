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

      // Already unlocked via cookie.
      if (req.cookies.get(ADMIN_COOKIE)?.value === expected) {
        return NextResponse.next();
      }

      // Cryptic magic-link: /admin?key=<ADMIN_PASSWORD> (or ?key= on any admin
      // path). If the key matches, set the cookie and redirect to the clean URL
      // so the secret never lingers in the address bar — no form needed. Make
      // ADMIN_PASSWORD a long random string and you've got an unguessable link.
      const key = req.nextUrl.searchParams.get("key");
      if (key && key === adminPw) {
        const url = req.nextUrl.clone();
        url.searchParams.delete("key");
        const res = NextResponse.redirect(url);
        res.cookies.set(ADMIN_COOKIE, expected, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return res;
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
