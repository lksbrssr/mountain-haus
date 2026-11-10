"use strict";

// Tiny zero-dependency comments backend for the Haus shopping list.
// Persists to a JSON file on a Fly volume mounted at /data.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || "/data";
const DATA_FILE = path.join(DATA_DIR, "comments.json");
const PRICES_FILE = path.join(DATA_DIR, "prices.json");
const VOTES_FILE = path.join(DATA_DIR, "votes.json");
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

function loadPrices() {
  try {
    return JSON.parse(fs.readFileSync(PRICES_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Price overrides: { [itemName]: number | null }. null means an explicit "TBD".
let prices = loadPrices();
let writingPrices = Promise.resolve();
function persistPrices() {
  const snapshot = JSON.stringify(prices);
  writingPrices = writingPrices
    .then(() => fs.promises.writeFile(PRICES_FILE, snapshot))
    .catch((e) => console.error("persist prices failed:", e));
  return writingPrices;
}

function loadVotes() {
  try {
    return JSON.parse(fs.readFileSync(VOTES_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Votes: { [itemName]: { up: [author, ...], down: [author, ...] } }
let votes = loadVotes();
let writingVotes = Promise.resolve();
function persistVotes() {
  const snapshot = JSON.stringify(votes);
  writingVotes = writingVotes
    .then(() => fs.promises.writeFile(VOTES_FILE, snapshot))
    .catch((e) => console.error("persist votes failed:", e));
  return writingVotes;
}

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
    return send(res, 200, {
      ok: true,
      count: comments.length,
      priceOverrides: Object.keys(prices).length,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/comments") {
    return send(res, 200, grouped());
  }

  if (req.method === "GET" && url.pathname === "/api/prices") {
    return send(res, 200, prices);
  }

  if (req.method === "GET" && url.pathname === "/api/votes") {
    return send(res, 200, votes);
  }

  if (req.method === "POST" && url.pathname === "/api/votes") {
    const chunks = [];
    let size = 0;
    let aborted = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > 1024 * 64) {
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
      const author = String(body.author || "").slice(0, 80).trim();
      const dir = body.dir === "down" ? "down" : body.dir === "up" ? "up" : null;
      const on = Boolean(body.on);
      if (!item || !author || !dir)
        return send(res, 400, { error: "item, author, dir required" });
      const entry = votes[item] || (votes[item] = { up: [], down: [] });
      entry.up = Array.isArray(entry.up) ? entry.up : [];
      entry.down = Array.isArray(entry.down) ? entry.down : [];
      const arr = entry[dir];
      const idx = arr.indexOf(author);
      if (on && idx === -1) arr.push(author);
      if (!on && idx !== -1) arr.splice(idx, 1);
      // A person can't both like and dislike — remove from the other side.
      if (on) {
        const other = dir === "up" ? entry.down : entry.up;
        const oi = other.indexOf(author);
        if (oi !== -1) other.splice(oi, 1);
      }
      persistVotes();
      return send(res, 200, { item, votes: entry });
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/prices") {
    const chunks = [];
    let size = 0;
    let aborted = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > 1024 * 64) {
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
      if (!item) return send(res, 400, { error: "item required" });
      let price = null;
      if (body.price !== null && body.price !== undefined && body.price !== "") {
        const n = Number(body.price);
        if (!Number.isFinite(n) || n < 0)
          return send(res, 400, { error: "bad price" });
        price = Math.round(n * 100) / 100;
      }
      prices[item] = price;
      persistPrices();
      return send(res, 200, { item, price });
    });
    return;
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
