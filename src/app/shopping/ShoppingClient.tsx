"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ShopItem } from "@/lib/shopping";

function formatEuro(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatWhen(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
  }).format(ts);
}

type UiStatus = "planned" | "bought" | "got" | "skip";

// Price string → number|null. Accepts "2.728,70", "2728,70" and "2728.70".
function parsePrice(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  let t = s.replace(/[^\d.,]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// Little round initials avatar, colour derived from the name.
const AVATAR_COLORS = [
  "bg-[#7c5cff]",
  "bg-lake",
  "bg-forest",
  "bg-clay",
  "bg-[#c86b4a]",
  "bg-[#2f8f6b]",
  "bg-[#b5873a]",
];
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
type Comment = {
  id: string;
  author: string;
  text: string;
  ts: number;
  images?: string[];
};

const COMMENTS_KEY = "haus-shopping-comments";
const NAME_KEY = "haus-shopping-name";

// Backend base URL (Fly.io). When unset, the page runs in localStorage-only
// mode so it still works, just without sharing comments across devices.
const API = process.env.NEXT_PUBLIC_COMMENTS_API?.replace(/\/$/, "") || "";

// Downscale + compress an uploaded image to a JPEG data URL so it fits
// comfortably in localStorage (which is where comments live).
function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const STATUS_LABEL: Record<UiStatus, string> = {
  planned: "Planned",
  bought: "Bought",
  got: "Got it",
  skip: "Not planned",
};
const STATUS_ORDER: UiStatus[] = ["planned", "bought", "got", "skip"];

function statusPillClass(s: UiStatus): string {
  if (s === "bought") return "bg-lake text-cream";
  if (s === "got") return "bg-forest text-cream";
  if (s === "skip") return "bg-ink/70 text-cream";
  return "bg-cream/90 text-forest ring-1 ring-clay/30";
}

export function ShoppingClient({ items }: { items: ShopItem[] }) {
  const [showPrices, setShowPrices] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<
    Record<string, number | null>
  >({});
  const [votes, setVotes] = useState<
    Record<string, { up: string[]; down: string[] }>
  >({});
  const [statuses, setStatuses] = useState<Record<string, UiStatus>>(() =>
    Object.fromEntries(items.map((i) => [i.name, i.status])),
  );
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<ShopItem | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [draftText, setDraftText] = useState("");
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  // Who you are — used as the author for every comment. Saved in the browser.
  const [identity, setIdentity] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [commentNameEdit, setCommentNameEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Close the status dropdown on any outside click (option/toggle clicks
  // stopPropagation, so they won't trigger this).
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenu]);

  // Load cached comments + remembered name instantly, then refresh from the
  // backend so comments are shared across everyone's devices.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMENTS_KEY);
      if (raw) setComments(JSON.parse(raw));
      const n = localStorage.getItem(NAME_KEY);
      if (n) {
        setIdentity(n);
        setNameDraft(n);
      }
    } catch {
      /* ignore */
    }
    if (!API) return;
    fetch(`${API}/api/comments`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Record<string, Comment[]>) => setComments(data))
      .catch(() => {
        /* offline — keep the cached copy */
      });
    fetch(`${API}/api/prices`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Record<string, number | null>) => setPriceOverrides(data))
      .catch(() => {});
    fetch(`${API}/api/votes`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Record<string, { up: string[]; down: string[] }>) =>
        setVotes(data),
      )
      .catch(() => {});
    fetch(`${API}/api/status`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Record<string, UiStatus>) =>
        setStatuses((prev) => ({ ...prev, ...data })),
      )
      .catch(() => {});
  }, []);

  // Cache comments locally so they appear instantly on the next visit.
  useEffect(() => {
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    } catch {
      /* ignore */
    }
  }, [comments]);

  function saveIdentity(name: string) {
    const clean = name.trim().slice(0, 80);
    setIdentity(clean);
    setEditingName(false);
    try {
      if (clean) localStorage.setItem(NAME_KEY, clean);
    } catch {
      /* ignore */
    }
  }

  // Reset per-item price editing + any pending delete when the item changes.
  useEffect(() => {
    setEditingPrice(false);
    setConfirmDelete(null);
  }, [openItem]);

  // Close the modal on Escape; lock background scroll while it's open.
  useEffect(() => {
    if (!openItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenItem(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openItem]);

  function toggleMenu(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenu((prev) => (prev === name ? null : name));
  }

  async function setStatus(
    e: React.MouseEvent,
    name: string,
    status: UiStatus,
  ) {
    e.preventDefault();
    e.stopPropagation();
    setStatuses((prev) => ({ ...prev, [name]: status }));
    setOpenMenu(null);
    if (!API) return;
    try {
      await fetch(`${API}/api/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: name, status }),
      });
    } catch {
      /* keep the optimistic value; next load reconciles */
    }
  }

  function votesFor(name: string): { up: string[]; down: string[] } {
    const v = votes[name];
    return { up: v?.up ?? [], down: v?.down ?? [] };
  }

  async function castVote(
    e: React.MouseEvent,
    name: string,
    dir: "up" | "down",
  ) {
    // Keep the card from opening the modal / navigating.
    e.preventDefault();
    e.stopPropagation();
    if (!identity) {
      setEditingName(true);
      return;
    }
    const current = votesFor(name);
    const mine = current[dir].includes(identity);
    const on = !mine; // toggle
    // Optimistic update (also drop me from the opposite side when turning on).
    setVotes((prev) => {
      const c = {
        up: [...(prev[name]?.up ?? [])],
        down: [...(prev[name]?.down ?? [])],
      };
      const arr = c[dir];
      const idx = arr.indexOf(identity);
      if (on && idx === -1) arr.push(identity);
      if (!on && idx !== -1) arr.splice(idx, 1);
      if (on) {
        const other = dir === "up" ? c.down : c.up;
        const oi = other.indexOf(identity);
        if (oi !== -1) other.splice(oi, 1);
      }
      return { ...prev, [name]: c };
    });
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: name, author: identity, dir, on }),
      });
      if (!res.ok) throw new Error("vote failed");
      const data: { item: string; votes: { up: string[]; down: string[] } } =
        await res.json();
      setVotes((prev) => ({ ...prev, [name]: data.votes }));
    } catch {
      /* leave the optimistic value; next load will reconcile */
    }
  }

  async function savePrice(name: string, raw: string) {
    const value = parsePrice(raw);
    setPriceOverrides((p) => ({ ...p, [name]: value }));
    if (!API) return;
    try {
      await fetch(`${API}/api/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: name, price: value }),
      });
    } catch {
      alert("Couldn't save the price — check your connection and try again.");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const pics = await Promise.all(
        Array.from(files)
          .filter((f) => f.type.startsWith("image/"))
          .slice(0, 6)
          .map((f) => compressImage(f).catch(() => null)),
      );
      const ok = pics.filter((p): p is string => Boolean(p));
      if (ok.length) setDraftImages((prev) => [...prev, ...ok].slice(0, 6));
    } finally {
      setUploading(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!openItem) return;
    const text = draftText.trim();
    if (!text && draftImages.length === 0) return;
    if (!identity) {
      setCommentNameEdit(true);
      return;
    }
    const item = openItem.name;
    const images = draftImages;
    const optimistic: Comment = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      author: identity,
      text,
      ts: Date.now(),
      ...(images.length ? { images } : {}),
    };
    // Optimistically show it right away.
    setComments((prev) => ({
      ...prev,
      [item]: [...(prev[item] ?? []), optimistic],
    }));
    setDraftText("");
    setDraftImages([]);

    if (!API) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, author: identity, text, images }),
      });
      if (!res.ok) throw new Error("post failed");
      const saved: Comment = await res.json();
      // Replace the optimistic entry with the server's canonical one.
      setComments((prev) => ({
        ...prev,
        [item]: (prev[item] ?? []).map((c) =>
          c.id === optimistic.id ? saved : c,
        ),
      }));
    } catch {
      // Network/server error — roll back and let them retry.
      setComments((prev) => ({
        ...prev,
        [item]: (prev[item] ?? []).filter((c) => c.id !== optimistic.id),
      }));
      setDraftText(text);
      setDraftImages(images);
      alert("Couldn't save that comment — check your connection and try again.");
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(item: string, id: string) {
    setConfirmDelete(null);
    setComments((prev) => ({
      ...prev,
      [item]: (prev[item] ?? []).filter((c) => c.id !== id),
    }));
    if (!API) return;
    try {
      await fetch(
        `${API}/api/comments/${id}?author=${encodeURIComponent(identity)}`,
        { method: "DELETE" },
      );
    } catch {
      /* ignore; next load reconciles */
    }
  }

  const commentsFor = (name: string): Comment[] => comments[name] ?? [];
  const statusOf = (name: string): UiStatus => statuses[name] ?? "planned";
  const priceOf = (item: ShopItem): number | null =>
    item.name in priceOverrides ? priceOverrides[item.name] : item.price;
  const known = items.filter((i) => priceOf(i) != null);
  const total = known.reduce((sum, i) => sum + (priceOf(i) ?? 0), 0);
  const boughtCount = items.filter((i) => statusOf(i.name) === "bought").length;
  const gotCount = items.filter((i) => statusOf(i.name) === "got").length;
  const skipCount = items.filter((i) => statusOf(i.name) === "skip").length;
  const plannedCount = items.length - boughtCount - gotCount - skipCount;

  return (
    <>
      {/* Hero strip */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
          The Haus · Furnishing list
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-5xl leading-[1.05] text-forest sm:text-6xl">
          Things for the haus
        </h1>

        {/* Self-identify: your name is used as the author on every comment. */}
        <div className="mt-6 text-sm">
          {identity && !editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-4 py-2 text-forest">
                <span className="text-base">👋</span>
                You&apos;re posting as <b className="font-semibold">{identity}</b>
              </span>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(identity);
                  setEditingName(true);
                }}
                className="rounded-full border border-clay/30 px-3 py-2 text-pine transition hover:border-forest/40"
              >
                Change name
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nameDraft.trim()) saveIdentity(nameDraft);
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-pine/80">Who are you?</span>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Your name"
                autoFocus={editingName}
                className="w-44 rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine outline-none focus:border-forest/50"
              />
              <button
                type="submit"
                disabled={!nameDraft.trim()}
                className="rounded-full bg-forest px-4 py-2 font-medium text-cream transition hover:brightness-110 disabled:opacity-40"
              >
                Save
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine">
            {items.length} items
          </span>
          <span className="rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine">
            {plannedCount} planned · {boughtCount} bought
            {gotCount > 0 ? ` · ${gotCount} got` : ""}
            {skipCount > 0 ? ` · ${skipCount} skipped` : ""}
          </span>
          {showPrices && (
            <span className="rounded-full bg-forest px-4 py-2 font-medium text-cream">
              {formatEuro(total)} total
            </span>
          )}

          {/* Price toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={showPrices}
            onClick={() => setShowPrices((v) => !v)}
            className="ml-auto flex items-center gap-2.5 rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine transition hover:border-forest/40"
          >
            <span>Show prices</span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${
                showPrices ? "bg-forest" : "bg-clay/40"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream transition ${
                  showPrices ? "left-[1.125rem]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>
      </section>

      {/* Product grid */}
      <section className="bg-sand/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.name}
                role="button"
                tabIndex={0}
                onClick={() => setOpenItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenItem(item);
                  }
                }}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-clay/25 bg-cream transition hover:-translate-y-1 hover:shadow-soft"
              >
                {/* Wrapper is NOT clipped, so the vote pill can hang below the image */}
                <div className="relative">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
                      className="object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute left-4 top-4 z-20">
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(e, item.name)}
                        aria-haspopup="menu"
                        aria-expanded={openMenu === item.name}
                        title="Change status"
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition hover:brightness-105 ${statusPillClass(
                          statusOf(item.name),
                        )}`}
                      >
                        {STATUS_LABEL[statusOf(item.name)]}
                        <span
                          className={`text-[0.6rem] leading-none transition ${
                            openMenu === item.name ? "rotate-180" : ""
                          }`}
                        >
                          ▾
                        </span>
                      </button>

                      {openMenu === item.name && (
                        <div
                          role="menu"
                          className="absolute left-0 top-full mt-1.5 w-36 overflow-hidden rounded-xl border border-clay/25 bg-cream p-1 shadow-soft"
                        >
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              type="button"
                              role="menuitemradio"
                              aria-checked={statusOf(item.name) === s}
                              onClick={(e) => setStatus(e, item.name, s)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-sand/60 ${
                                statusOf(item.name) === s
                                  ? "font-semibold text-forest"
                                  : "text-pine"
                              }`}
                            >
                              {STATUS_LABEL[s]}
                              {statusOf(item.name) === s ? (
                                <span className="text-lake">✓</span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vote pill — sits at the image's bottom-right, 35% of its
                      height protruding below the image edge. */}
                  <div className="absolute bottom-0 right-4 flex translate-y-[35%] items-center gap-1.5">
                    {(["up", "down"] as const).map((dir) => {
                      const names = votesFor(item.name)[dir];
                      const count = names.length;
                      const mine = identity ? names.includes(identity) : false;
                      const active = count > 0;
                      const activeBg = dir === "up" ? "bg-lake/15" : "bg-clay/20";
                      const activeRing = mine
                        ? dir === "up"
                          ? "border-lake"
                          : "border-clay"
                        : dir === "up"
                          ? "border-lake/50"
                          : "border-clay/50";
                      return (
                        <div key={dir} className="group/vote relative">
                          <button
                            type="button"
                            aria-label={dir === "up" ? "Thumbs up" : "Thumbs down"}
                            onClick={(e) => castVote(e, item.name, dir)}
                            className={`flex h-[1.71rem] items-center justify-center gap-1 rounded-full border text-[0.855rem] leading-none shadow-soft transition hover:scale-105 ${
                              active
                                ? `${activeBg} ${activeRing} px-2`
                                : "w-[1.71rem] border-clay/20 bg-cream opacity-80 hover:opacity-100"
                            }`}
                          >
                            <span>{dir === "up" ? "👍" : "👎"}</span>
                            {active ? (
                              <span className="text-[0.72rem] font-semibold text-forest">
                                {count}
                              </span>
                            ) : null}
                          </button>
                          {count > 0 && (
                            <div className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 hidden w-max max-w-[12rem] rounded-lg bg-ink/90 px-2.5 py-1.5 text-left text-[0.7rem] leading-snug text-cream shadow-soft group-hover/vote:block">
                              <span className="opacity-70">
                                {dir === "up" ? "Liked by" : "Disliked by"}:
                              </span>{" "}
                              {names.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-clay">
                    {item.category}
                  </p>
                  <h3 className="mt-1 font-display text-xl leading-snug text-forest">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-pine/80">{item.brand}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-pine/90">
                    {item.blurb}
                  </p>

                  {commentsFor(item.name).length > 0 && (
                    <p className="mt-3 text-xs font-medium text-lake">
                      💬 {commentsFor(item.name).length}{" "}
                      {commentsFor(item.name).length === 1
                        ? "comment"
                        : "comments"}
                    </p>
                  )}

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      {showPrices ? (
                        priceOf(item) != null ? (
                          <p className="font-display text-2xl text-forest">
                            {formatEuro(priceOf(item)!)}
                            {item.priceNote ? (
                              <span className="ml-1 font-sans text-sm text-pine/70">
                                {item.priceNote}
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="font-display text-lg text-pine/60">TBD</p>
                        )
                      ) : (
                        <p className="font-display text-lg text-pine/40">—</p>
                      )}
                      <p className="mt-0.5 text-xs text-clay">{item.source}</p>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full border border-forest/30 px-4 py-2 text-sm text-forest transition group-hover:bg-forest group-hover:text-cream"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Item detail + comments modal */}
      {openItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setOpenItem(null)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={openItem.name}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-cream shadow-soft md:grid md:max-h-[85vh] md:grid-cols-2"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenItem(null)}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-pine ring-1 ring-clay/30 transition hover:bg-sand"
            >
              ✕
            </button>

            {/* Left: product */}
            <div className="flex min-h-0 flex-col overflow-y-auto border-b border-clay/20 md:border-b-0 md:border-r">
              <div className="relative aspect-[4/3] w-full shrink-0 bg-white">
                <Image
                  src={openItem.image}
                  alt={openItem.name}
                  fill
                  /* Same sizes as the grid card so the browser reuses the
                     already-loaded image — it appears instantly. */
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
                  className="object-contain p-5"
                />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-clay">
                  {openItem.category}
                </p>
                <h3 className="mt-1 font-display text-2xl leading-snug text-forest">
                  {openItem.name}
                </h3>
                <p className="mt-0.5 text-sm text-pine/80">{openItem.brand}</p>
                <p className="mt-3 text-sm leading-relaxed text-pine/90">
                  {openItem.blurb}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    {editingPrice ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="text"
                          inputMode="decimal"
                          defaultValue={
                            priceOf(openItem) != null
                              ? String(priceOf(openItem))
                              : ""
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          onBlur={(e) => {
                            savePrice(openItem.name, e.target.value);
                            setEditingPrice(false);
                          }}
                          placeholder="TBD"
                          className="w-28 rounded-lg border border-clay/40 bg-white px-2 py-1 font-display text-xl text-forest outline-none focus:border-forest"
                        />
                        <span className="font-display text-xl text-pine/70">€</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {priceOf(openItem) != null ? (
                          <p className="font-display text-2xl text-forest">
                            {formatEuro(priceOf(openItem)!)}
                            {openItem.priceNote ? (
                              <span className="ml-1 font-sans text-sm text-pine/70">
                                {openItem.priceNote}
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="font-display text-lg text-pine/60">TBD</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingPrice(true)}
                          title="Edit price"
                          className="rounded-full border border-clay/30 px-2 py-1 text-xs text-pine transition hover:border-forest/40"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                    <p className="mt-0.5 text-xs text-clay">{openItem.source}</p>
                  </div>
                  <a
                    href={openItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-forest/30 px-4 py-2 text-sm text-forest transition hover:bg-forest hover:text-cream"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>

            {/* Right: comments */}
            <div className="flex min-h-0 flex-col">
              <div className="shrink-0 border-b border-clay/20 px-6 py-4">
                <h4 className="font-display text-lg text-forest">Comments</h4>
                <p className="text-xs text-clay">
                  {commentsFor(openItem.name).length} so far
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                {commentsFor(openItem.name).length === 0 ? (
                  <p className="text-sm text-pine/60">
                    No comments yet — start the conversation.
                  </p>
                ) : (
                  commentsFor(openItem.name).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-clay/20 bg-sand/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold text-cream ${avatarColor(
                            c.author,
                          )}`}
                        >
                          {initialsOf(c.author)}
                        </span>
                        <span className="text-sm font-semibold text-forest">
                          {c.author}
                        </span>
                        <span className="ml-auto text-[0.7rem] text-clay">
                          {formatWhen(c.ts)}
                        </span>
                      </div>
                      {c.text ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pine/90">
                          {c.text}
                        </p>
                      ) : null}
                      {c.images && c.images.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.images.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={src}
                              alt=""
                              onClick={() => setLightbox(src)}
                              className="h-20 w-20 cursor-zoom-in rounded-lg object-cover ring-1 ring-clay/20"
                            />
                          ))}
                        </div>
                      ) : null}
                      {identity && c.author === identity ? (
                        <div className="mt-2 flex justify-end gap-3 text-[0.7rem]">
                          {confirmDelete === c.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteComment(openItem.name, c.id)
                                }
                                className="font-semibold text-[#b5552f] underline underline-offset-2"
                              >
                                Confirm delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="text-clay underline underline-offset-2 transition hover:text-pine"
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(c.id)}
                              className="text-clay underline underline-offset-2 transition hover:text-pine"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={addComment}
                className="shrink-0 border-t border-clay/20 px-6 py-4"
              >
                <div className="flex gap-3">
                  {identity ? (
                    <span
                      title={identity}
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-cream ${avatarColor(
                        identity,
                      )}`}
                    >
                      {initialsOf(identity)}
                    </span>
                  ) : null}
                  <div className="flex-1">
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter posts; Shift+Enter makes a new line.
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Add a comment…  (Enter to post, Shift+Enter for a new line)"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-clay/30 bg-cream px-3 py-2 text-sm text-pine outline-none focus:border-forest/50"
                    />

                {draftImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {draftImages.map((src, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover ring-1 ring-clay/20"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() =>
                            setDraftImages((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-[0.65rem] text-cream"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-clay/30 px-3 py-2 text-sm text-pine transition hover:border-forest/40">
                        <span>{uploading ? "…" : "📎 Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          !identity ||
                          posting ||
                          (!draftText.trim() && draftImages.length === 0)
                        }
                        className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {posting ? "Posting…" : "Post"}
                      </button>
                    </div>

                    {/* Who you're commenting as — click the name to change it. */}
                    {commentNameEdit ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          autoFocus
                          placeholder="Your name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && nameDraft.trim()) {
                              e.preventDefault();
                              saveIdentity(nameDraft);
                              setCommentNameEdit(false);
                            }
                          }}
                          className="w-40 rounded-full border border-clay/30 bg-cream px-3 py-1.5 text-xs text-pine outline-none focus:border-forest/50"
                        />
                        <button
                          type="button"
                          disabled={!nameDraft.trim()}
                          onClick={() => {
                            saveIdentity(nameDraft);
                            setCommentNameEdit(false);
                          }}
                          className="rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-cream disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    ) : identity ? (
                      <p className="mt-2 text-xs text-clay">
                        Commenting as{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setNameDraft(identity);
                            setCommentNameEdit(true);
                          }}
                          className="font-semibold text-forest underline underline-offset-2 transition hover:text-lake"
                        >
                          {identity}
                        </button>
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-clay">
                        Commenting disabled —{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setNameDraft("");
                            setCommentNameEdit(true);
                          }}
                          className="font-semibold text-forest underline underline-offset-2 transition hover:text-lake"
                        >
                          choose a name
                        </button>{" "}
                        to join in.
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
