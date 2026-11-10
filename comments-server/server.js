"use strict";

// Tiny zero-dependency comments backend for the Haus shopping list.
// Persists to a JSON file on a Fly volume mounted at /data.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || "/data";
const DATA_FILE = path.join(DATA_DIR, "comments.json");
const PORT = Number(process.env.PORT || 8080);
const MAX_BODY = 14 * 1024 * 1024; // 14 MB — comment images arrive as data URLs

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

let comments = load();

// Serialize writes so concurrent posts can't clobber the file.
let writing = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(comments);
  writing = writing
    .then(() => fs.promises.writeFile(DATA_FILE, snapshot))
    .catch((e) => console.error("persist failed:", e));
  return writing;
}

function send(res, status, body) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

function grouped() {
  const out = {};
  for (const c of comments) {
    (out[c.item] ||= []).push({
      id: c.id,
      author: c.author,
      text: c.text,
      ts: c.ts,
      images: c.images || [],
    });
  }
  for (const k in out) out[k].sort((a, b) => a.ts - b.ts);
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.method === "GET" && url.pathname === "/healthz") {
    return send(res, 200, { ok: true, count: comments.length });
  }

  if (req.method === "GET" && url.pathname === "/api/comments") {
    return send(res, 200, grouped());
  }

  if (req.method === "POST" && url.pathname === "/api/comments") {
    let size = 0;
    const chunks = [];
    let aborted = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        aborted = true;
        send(res, 413, { error: "too large" });
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (aborted) return;
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return send(res, 400, { error: "bad json" });
      }
      const item = String(body.item || "").slice(0, 300).trim();
      const author =
        String(body.author || "Guest").slice(0, 80).trim() || "Guest";
      const text = String(body.text || "").slice(0, 4000);
      const images = Array.isArray(body.images)
        ? body.images
            .filter((s) => typeof s === "string" && s.startsWith("data:image/"))
            .slice(0, 6)
        : [];
      if (!item) return send(res, 400, { error: "item required" });
      if (!text.trim() && images.length === 0)
        return send(res, 400, { error: "empty" });

      const entry = {
        id: crypto.randomUUID(),
        item,
        author,
        text,
        ts: Date.now(),
        images,
      };
      comments.push(entry);
      persist();
      send(res, 201, {
        id: entry.id,
        author: entry.author,
        text: entry.text,
        ts: entry.ts,
        images: entry.images,
      });
    });
    return;
  }

  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => console.log("Haus comments server listening on", PORT));
