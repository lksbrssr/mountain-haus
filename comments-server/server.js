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
const STATUS_FILE = path.join(DATA_DIR, "status.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");
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

function loadStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Status overrides: { [itemName]: "planned" | "bought" | "got" | "skip" }
const STATUS_VALUES = ["planned", "bought", "got", "skip"];
let status = loadStatus();
let writingStatus = Promise.resolve();
function persistStatus() {
  const snapshot = JSON.stringify(status);
  writingStatus = writingStatus
    .then(() => fs.promises.writeFile(STATUS_FILE, snapshot))
    .catch((e) => console.error("persist status failed:", e));
  return writingStatus;
}

function loadGroups() {
  try {
    return JSON.parse(fs.readFileSync(GROUPS_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Group-booking polls (Doodle-style). Anyone can create one.
//   groups = {
//     [groupId]: {
//       id, title, organizer, createdAt,
//       weekends: [{ id, start, end, note? }],
//       availability: { [author]: { [weekendId]: "yes"|"maybe"|"no" } },
//     }
//   }
const AVAILABILITY_VALUES = ["yes", "maybe", "no"];
let groups = loadGroups();
let writingGroups = Promise.resolve();
function persistGroups() {
  const snapshot = JSON.stringify(groups);
  writingGroups = writingGroups
    .then(() => fs.promises.writeFile(GROUPS_FILE, snapshot))
    .catch((e) => console.error("persist groups failed:", e));
  return writingGroups;
}

// Short, URL-friendly id for a new group.
function newGroupId() {
  return crypto.randomBytes(6).toString("base64url");
}

// Lightweight summary (no availability payload) for the index list.
function groupSummary(g) {
  return {
    id: g.id,
    title: g.title,
    organizer: g.organizer,
    createdAt: g.createdAt,
    weekends: g.weekends,
    people: Object.keys(g.availability || {}).length,
  };
}

// Read a JSON body (small), then call cb(body). Shared by the group routes.
function readJson(req, res, cb, limit = 1024 * 64) {
  const chunks = [];
  let size = 0;
  let aborted = false;
  req.on("data", (c) => {
    size += c.length;
    if (size > limit) {
      aborted = true;
      send(res, 413, { error: "too large" });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on("end", () => {
    if (aborted) return;
    try {
      cb(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    } catch {
      send(res, 400, { error: "bad json" });
    }
  });
}

function sanitizeWeekends(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const w of raw) {
    if (!w || typeof w !== "object") continue;
    const id = String(w.id || "").slice(0, 40).trim();
    const start = String(w.start || "").slice(0, 10).trim();
    const end = String(w.end || "").slice(0, 10).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) continue;
    const key = id || `w-${start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const item = { id: key, start, end };
    const note = String(w.note || "").slice(0, 80).trim();
    if (note) item.note = note;
    out.push(item);
    if (out.length >= 7) break;
  }
  return out;
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
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
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
      statusOverrides: Object.keys(status).length,
      groups: Object.keys(groups).length,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/comments") {
    return send(res, 200, grouped());
  }

  if (
    req.method === "DELETE" &&
    url.pathname.startsWith("/api/comments/")
  ) {
    const id = decodeURIComponent(
      url.pathname.slice("/api/comments/".length),
    );
    const author = url.searchParams.get("author") || "";
    const idx = comments.findIndex((c) => c.id === id);
    if (idx === -1) return send(res, 404, { error: "not found" });
    // Only the comment's author can delete it.
    if (!author || comments[idx].author !== author)
      return send(res, 403, { error: "not your comment" });
    comments.splice(idx, 1);
    persist();
    return send(res, 200, { ok: true, id });
  }

  if (req.method === "GET" && url.pathname === "/api/prices") {
    return send(res, 200, prices);
  }

  if (req.method === "GET" && url.pathname === "/api/votes") {
    return send(res, 200, votes);
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    return send(res, 200, status);
  }

  // ---- Group booking (Doodle-style weekend polls) ----

  // List all groups (summaries only — no availability payload).
  if (req.method === "GET" && url.pathname === "/api/groups") {
    const list = Object.values(groups)
      .map(groupSummary)
      .sort((a, b) => b.createdAt - a.createdAt);
    return send(res, 200, list);
  }

  // Create a group. Body: { title, organizer, weekends: [{id,start,end,note?}] }.
  if (req.method === "POST" && url.pathname === "/api/groups") {
    return readJson(req, res, (body) => {
      const title = String(body.title || "").slice(0, 120).trim();
      const organizer = String(body.organizer || "").slice(0, 80).trim();
      const weekends = sanitizeWeekends(body.weekends);
      if (!title) return send(res, 400, { error: "title required" });
      if (!organizer) return send(res, 400, { error: "organizer required" });
      if (weekends.length === 0)
        return send(res, 400, { error: "pick at least one weekend" });
      let id = newGroupId();
      while (groups[id]) id = newGroupId();
      const group = {
        id,
        title,
        organizer,
        createdAt: Date.now(),
        weekends,
        // The organizer is in by default on every offered weekend.
        availability: {
          [organizer]: Object.fromEntries(weekends.map((w) => [w.id, "yes"])),
        },
      };
      groups[id] = group;
      persistGroups();
      return send(res, 201, group);
    });
  }

  // Single group with its full availability board.
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/groups/") &&
    !url.pathname.endsWith("/availability") &&
    !url.pathname.endsWith("/remove")
  ) {
    const id = decodeURIComponent(url.pathname.slice("/api/groups/".length));
    const g = groups[id];
    if (!g) return send(res, 404, { error: "not found" });
    return send(res, 200, g);
  }

  // Set/clear one person's availability within a group.
  // POST /api/groups/:id/availability  { author, weekend, state }
  if (
    req.method === "POST" &&
    url.pathname.startsWith("/api/groups/") &&
    url.pathname.endsWith("/availability")
  ) {
    const id = decodeURIComponent(
      url.pathname.slice("/api/groups/".length, -"/availability".length),
    );
    const g = groups[id];
    if (!g) return send(res, 404, { error: "not found" });
    return readJson(req, res, (body) => {
      const author = String(body.author || "").slice(0, 80).trim();
      const weekend = String(body.weekend || "").slice(0, 60).trim();
      const raw = body.state;
      if (!author || !weekend)
        return send(res, 400, { error: "author, weekend required" });
      if (!g.weekends.some((w) => w.id === weekend))
        return send(res, 400, { error: "unknown weekend" });
      const clearing = raw === null || raw === undefined || raw === "";
      const state = clearing ? null : String(raw);
      if (!clearing && !AVAILABILITY_VALUES.includes(state))
        return send(res, 400, { error: "bad state" });
      const entry = g.availability[author] || (g.availability[author] = {});
      if (clearing) delete entry[weekend];
      else entry[weekend] = state;
      if (Object.keys(entry).length === 0 && author !== g.organizer)
        delete g.availability[author];
      persistGroups();
      return send(res, 200, { author, weekend, state });
    });
  }

  // Remove a whole person from a group. POST /api/groups/:id/remove { author }.
  if (
    req.method === "POST" &&
    url.pathname.startsWith("/api/groups/") &&
    url.pathname.endsWith("/remove")
  ) {
    const id = decodeURIComponent(
      url.pathname.slice("/api/groups/".length, -"/remove".length),
    );
    const g = groups[id];
    if (!g) return send(res, 404, { error: "not found" });
    return readJson(req, res, (body) => {
      const author = String(body.author || "").slice(0, 80).trim();
      if (!author) return send(res, 400, { error: "author required" });
      delete g.availability[author];
      persistGroups();
      return send(res, 200, { ok: true, author });
    });
  }

  // Delete a whole group — organizer only. DELETE /api/groups/:id?author=NAME
  if (
    req.method === "DELETE" &&
    url.pathname.startsWith("/api/groups/")
  ) {
    const id = decodeURIComponent(url.pathname.slice("/api/groups/".length));
    const g = groups[id];
    if (!g) return send(res, 404, { error: "not found" });
    const author = url.searchParams.get("author") || "";
    if (!author || author !== g.organizer)
      return send(res, 403, { error: "organizer only" });
    delete groups[id];
    persistGroups();
    return send(res, 200, { ok: true, id });
  }

  if (req.method === "POST" && url.pathname === "/api/status") {
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
      const value = String(body.status || "");
      if (!item) return send(res, 400, { error: "item required" });
      if (!STATUS_VALUES.includes(value))
        return send(res, 400, { error: "bad status" });
      status[item] = value;
      persistStatus();
      return send(res, 200, { item, status: value });
    });
    return;
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
