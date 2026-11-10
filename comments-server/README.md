# Haus comments backend (Fly.io)

A tiny zero-dependency Node service that stores `/shopping` comments in a JSON
file on a Fly volume. The Next.js frontend (on Vercel) calls it directly.

## API

- `GET /api/comments` → `{ [itemName]: Comment[] }`
- `POST /api/comments` with `{ item, author, text, images? }` → the created comment
- `GET /healthz` → `{ ok: true, count }`

`Comment = { id, author, text, ts, images: string[] }`. Images are JPEG data URLs.
CORS is open (`*`); there are no cookies or auth — it's a family furnishing list.

## Deploy (one time)

```bash
cd comments-server
fly auth login            # uses your existing Fly account
./deploy.sh               # creates app + volume, then deploys
```

The script prints the API base URL, e.g. `https://mountain-haus-comments.fly.dev`.

> App names are global on Fly. If `mountain-haus-comments` is taken, change `app`
> in `fly.toml` and run `APP=your-name ./deploy.sh`.

## Point the frontend at it

In the Vercel project (haus-am-see), add an env var:

```
NEXT_PUBLIC_COMMENTS_API = https://mountain-haus-comments.fly.dev
```

Redeploy the frontend. Without this var the page falls back to localStorage-only
comments (per-browser, not shared).

## Redeploy after changes

```bash
cd comments-server && fly deploy
```

## Inspect data

```bash
fly ssh console -a mountain-haus-comments -C "cat /data/comments.json"
```
