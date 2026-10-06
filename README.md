# The Haus 🏔️

A small, pretty booking site for a holiday home in Bayrischzell. Each room has
its own page, a mini "checkout" collects reservation requests (everything is
**free**), there's a what-to-do-in-the-area guide and a "good to know" section
for guests (WiFi, laundry, etc.), and the whole site sits behind a shared
password. Reservation requests land in a Google Sheet you own.

Built with Next.js + Tailwind, deployed on Vercel. PRs welcome — the easiest
things to change are in `src/lib/`.

---

## Make it yours (no code required)

| What | Where |
|------|-------|
| House name, tagline, location, address, blurb, hero photo | `src/lib/house.ts` |
| Rooms (add/remove/edit, photos, amenities) | `src/lib/rooms.ts` |
| What-to-do-in-the-area guide | `src/lib/area.ts` |
| Good-to-know info (WiFi password, laundry, etc.) | `src/lib/info.ts` |
| The site password | Vercel env var `SITE_PASSWORD` |

Room photos aren't in yet — `images` is left empty in `src/lib/rooms.ts`, so the
site shows tasteful "photo coming soon" placeholders. Add any image URL (Unsplash
works out of the box) when you have real photos.

---

## Run locally

```bash
npm install
cp .env.example .env.local   # then edit SITE_PASSWORD
npm run dev                  # http://localhost:3000
```

Without `SHEETS_WEBHOOK_URL` set, requests are logged to the console and the
site still works — handy for local dev.

---

## Environment variables

| Variable | Required | What it does |
|----------|----------|--------------|
| `SITE_PASSWORD` | yes | The shared password for the whole site. If unset, the site is open. |
| `SHEETS_WEBHOOK_URL` | no | Google Apps Script web-app URL that appends requests to your sheet. |
| `SHEETS_WEBHOOK_SECRET` | no | Shared secret so only this site can write to your sheet. |

---

## Wiring up the Google Sheet (the "database")

There's no database to run — reservations append to a Google Sheet via a tiny
Google Apps Script. Free forever, and you read bookings from your phone.

Full step-by-step is in [`apps-script/Code.gs`](apps-script/Code.gs). Short version:

1. New Google Sheet, tab named **Reservations**, with this header row:
   `Received | Reference | Room | Check in | Check out | Nights | Guests | Name | Email | Phone | Notes`
2. **Extensions → Apps Script**, paste `apps-script/Code.gs`, Deploy as a **Web app**
   (*Execute as: Me*, *Access: Anyone*).
3. Copy the `/exec` URL into the Vercel env var `SHEETS_WEBHOOK_URL`.
4. (Optional) set a matching secret in both `Code.gs` (`SECRET`) and Vercel
   (`SHEETS_WEBHOOK_SECRET`).

Prefer email instead of a sheet? Uncomment the `MailApp.sendEmail(...)` block in
`Code.gs` and you'll get an email on every request too.

---

## Deploy

Already on Vercel. Pushes to `main` deploy to production; every PR gets its own
preview URL automatically. Set the env vars in **Vercel → Settings →
Environment Variables**.
