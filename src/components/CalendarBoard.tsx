"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReservation } from "@/lib/reservations";
import { prettyRange, rangesOverlap, maxBookingDateISO } from "@/lib/format";

type RoomRef = { slug: string; name: string; sleeps: number };
type Mode = "week" | "fortnight" | "month" | "quarter" | "year";
type CartItem = {
  id: string;
  slug: string;
  name: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
};

const MAX_REQUESTS = 10;

const ROOM_STYLES = [
  "bg-lake text-cream",
  "bg-pine text-cream",
  "bg-clay text-forest",
  "bg-forest text-cream",
];
const ROOM_PENDING = [
  "border-lake text-lake bg-lake/10",
  "border-pine text-pine bg-pine/10",
  "border-clay text-clay bg-clay/15",
  "border-forest text-forest bg-forest/10",
];

const MODES: { key: Mode; label: string; cellW: number; header: "day" | "month" }[] = [
  { key: "week", label: "Week", cellW: 100, header: "day" },
  { key: "fortnight", label: "2 weeks", cellW: 58, header: "day" },
  { key: "month", label: "Month", cellW: 40, header: "day" },
  { key: "quarter", label: "Quarter", cellW: 15, header: "month" },
  { key: "year", label: "Year", cellW: 6, header: "month" },
];

const DAY = 86_400_000;
const GRID = "rgba(185,163,126,0.18)";
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export function CalendarBoard({ rooms }: { rooms: RoomRef[] }) {
  const [mode, setMode] = useState<Mode>("month");
  const [anchorISO, setAnchorISO] = useState(toISO(new Date()));
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<{ room: number; a: number; b: number } | null>(null);
  const [guests, setGuests] = useState(2);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dragging = useRef(false);
  const touchDown = useRef<{ room: number; idx: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const cfg = MODES.find((m) => m.key === mode)!;
  const cellW = cfg.cellW;
  const anchor = parse(anchorISO);
  const todayISO = toISO(new Date());
  const todayStart = parse(todayISO);
  const labelW = 128;
  const laneH = 30;

  const natural = useMemo(() => {
    const y = anchor.getFullYear();
    const mo = anchor.getMonth();
    if (mode === "week") return { start: mondayOf(anchor), days: 7 };
    if (mode === "fortnight") return { start: mondayOf(anchor), days: 14 };
    if (mode === "month") return { start: new Date(y, mo, 1), days: daysInMonth(y, mo) };
    if (mode === "quarter") {
      const qm = Math.floor(mo / 3) * 3;
      return {
        start: new Date(y, qm, 1),
        days: daysInMonth(y, qm) + daysInMonth(y, qm + 1) + daysInMonth(y, qm + 2),
      };
    }
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return { start: new Date(y, 0, 1), days: leap ? 366 : 365 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchorISO]);

  const atStart = natural.start.getTime() <= todayStart.getTime();
  const windowStart = atStart ? todayStart : natural.start;
  const skipped = atStart ? Math.round((todayStart.getTime() - natural.start.getTime()) / DAY) : 0;
  const totalDays = Math.max(1, natural.days - skipped);

  const windowStartISO = toISO(windowStart);
  const windowEndISO = toISO(addDays(windowStart, totalDays));
  const dayAreaW = totalDays * cellW;
  const dayIndex = (iso: string) => Math.round((parse(iso).getTime() - windowStart.getTime()) / DAY);
  const todayIdx = dayIndex(todayISO);
  const days = Array.from({ length: totalDays }, (_, i) => addDays(windowStart, i));

  const monthSegs = useMemo(() => {
    const segs: { start: number; span: number; date: Date }[] = [];
    let i = 0;
    while (i < totalDays) {
      const d = addDays(windowStart, i);
      const left = daysInMonth(d.getFullYear(), d.getMonth()) - d.getDate() + 1;
      const span = Math.min(left, totalDays - i);
      segs.push({ start: i, span, date: new Date(d.getFullYear(), d.getMonth(), 1) });
      i += span;
    }
    return segs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchorISO, totalDays]);

  useEffect(() => {
    setSel(null);
    const el = scrollRef.current;
    if (el)
      el.scrollLeft =
        todayIdx >= 0 && todayIdx < totalDays
          ? Math.max(0, labelW + todayIdx * cellW - el.clientWidth / 2)
          : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchorISO, loading]);

  function shift(dir: number) {
    if (dir < 0 && atStart) return;
    if (mode === "week") setAnchorISO(toISO(addDays(windowStart, dir * 7)));
    else if (mode === "fortnight") setAnchorISO(toISO(addDays(windowStart, dir * 14)));
    else {
      const step = mode === "month" ? 1 : mode === "quarter" ? 3 : 12;
      setAnchorISO(toISO(new Date(anchor.getFullYear(), anchor.getMonth() + dir * step, 1)));
    }
  }

  const rangeLabel =
    mode === "year"
      ? String(windowStart.getFullYear())
      : mode === "quarter"
        ? `Q${Math.floor(windowStart.getMonth() / 3) + 1} ${windowStart.getFullYear()}`
        : mode === "month"
          ? windowStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
          : `${windowStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(windowStart, totalDays - 1).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  function lanesFor(room: RoomRef) {
    const inWin = reservations
      .filter((r) => r.room === room.name && r.checkOut > windowStartISO && r.checkIn < windowEndISO)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const lanes: PublicReservation[][] = [];
    for (const b of inWin) {
      const lane = lanes.find((l) => l[l.length - 1].checkOut <= b.checkIn);
      if (lane) lane.push(b);
      else lanes.push([b]);
    }
    return lanes;
  }

  const idxFromX = (clientX: number, el: HTMLElement) =>
    Math.min(totalDays - 1, Math.max(0, Math.floor((clientX - el.getBoundingClientRect().left) / cellW)));

  function onDown(e: React.PointerEvent<HTMLDivElement>, ri: number) {
    const idx = idxFromX(e.clientX, e.currentTarget);
    if (e.pointerType === "mouse") {
      e.preventDefault();
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setSel({ room: ri, a: idx, b: idx });
    } else {
      touchDown.current = { room: ri, idx };
    }
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>, ri: number) {
    if (!dragging.current || !sel || sel.room !== ri) return;
    const idx = idxFromX(e.clientX, e.currentTarget);
    setSel((s) => (s ? { ...s, b: idx } : s));
  }
  function onUp(e: React.PointerEvent<HTMLDivElement>, ri: number) {
    if (e.pointerType !== "mouse" && touchDown.current?.room === ri) {
      const idx = idxFromX(e.clientX, e.currentTarget);
      if (idx === touchDown.current.idx) setSel({ room: ri, a: idx, b: idx });
      touchDown.current = null;
    }
  }

  const selInfo = useMemo(() => {
    if (!sel) return null;
    const s = Math.min(sel.a, sel.b);
    const e = Math.max(sel.a, sel.b);
    const room = rooms[sel.room];
    const checkIn = toISO(addDays(windowStart, s));
    const checkOut = toISO(addDays(windowStart, e + 1));
    const nights = e - s + 1;
    const conflictExisting = reservations.some(
      (r) => r.room === room.name && rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut),
    );
    const conflictCart = cart.some(
      (c) => c.slug === room.slug && rangesOverlap(checkIn, checkOut, c.checkIn, c.checkOut),
    );
    return { room, checkIn, checkOut, nights, conflict: conflictExisting || conflictCart };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, anchorISO, mode, reservations, cart]);

  function addToCart() {
    if (!selInfo) return;
    setFormError(null);
    if (selInfo.checkOut > maxBookingDateISO()) {
      setFormError("Bookings can only be up to two years ahead.");
      return;
    }
    if (selInfo.conflict) {
      setFormError("Those dates overlap a stay that's already booked or added.");
      return;
    }
    if (cart.length >= MAX_REQUESTS) {
      setFormError(`You've reached the max number of booking requests (${MAX_REQUESTS}).`);
      return;
    }
    setCart((c) => [
      ...c,
      {
        id: uid(),
        slug: selInfo.room.slug,
        name: selInfo.room.name,
        checkIn: selInfo.checkIn,
        checkOut: selInfo.checkOut,
        nights: selInfo.nights,
        guests: Math.min(guests, selInfo.room.sleeps),
      },
    ]);
    setSel(null);
  }

  function removeFromCart(id: string) {
    setCart((c) => c.filter((x) => x.id !== id));
    setFormError(null);
  }

  async function submitAll() {
    setSubmitError(null);
    if (cart.length === 0) return;
    if (!name.trim() || !email.trim()) {
      setSubmitError("Please add your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reserve-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          notes,
          bookings: cart.map((c) => ({
            slug: c.slug,
            roomName: c.name,
            checkIn: c.checkIn,
            checkOut: c.checkOut,
            nights: c.nights,
            guests: c.guests,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong sending your requests.");
      }
      window.location.href = `/booked?count=${cart.length}`;
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  }

  const btn = "rounded-lg px-3 py-1.5 text-sm transition";
  const field =
    "mt-1 w-full rounded-lg border border-clay/40 bg-white px-3 py-2 text-forest outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/30";
  const gridBg = { backgroundImage: `repeating-linear-gradient(to right, ${GRID} 0 1px, transparent 1px ${cellW}px)` };

  return (
    <div className="mt-8 select-none">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} disabled={atStart} className={`${btn} border border-clay/40 enabled:hover:bg-cream disabled:opacity-40`} aria-label="Previous">←</button>
          <button onClick={() => setAnchorISO(todayISO)} className={`${btn} border border-clay/40 hover:bg-cream`}>Today</button>
          <button onClick={() => shift(1)} className={`${btn} border border-clay/40 hover:bg-cream`} aria-label="Next">→</button>
          <span className="ml-2 font-display text-xl text-forest">{rangeLabel}</span>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-cream p-1">
          {MODES.map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)} className={`${btn} ${mode === m.key ? "bg-forest text-cream" : "text-pine hover:bg-sand/60"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div ref={scrollRef} className="mt-5 overflow-x-auto rounded-3xl border border-clay/30 bg-cream">
        <div style={{ width: labelW + dayAreaW }} className="min-w-full">
          {/* Header */}
          <div className="flex border-b border-clay/30">
            <div style={{ width: labelW }} className="sticky left-0 z-20 shrink-0 bg-cream p-3 text-xs uppercase tracking-wider text-clay">Room</div>
            <div className="relative" style={{ width: dayAreaW }}>
              {cfg.header === "day" ? (
                <div className="flex">
                  {days.map((d) => {
                    const iso = toISO(d);
                    const weekend = d.getDay() === 0 || d.getDay() === 6;
                    const isToday = iso === todayISO;
                    return (
                      <div key={iso} style={{ width: cellW }} className={`shrink-0 border-l border-clay/20 py-2 text-center ${weekend ? "bg-sand/50" : ""} ${isToday ? "bg-lake/15" : ""}`}>
                        <div className="text-[10px] uppercase text-clay">{d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2)}</div>
                        <div className={`text-sm ${isToday ? "font-bold text-lake" : "text-forest"}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex">
                  {monthSegs.map((s) => (
                    <div key={s.start} style={{ width: s.span * cellW }} className="shrink-0 border-l border-clay/30 py-2.5 pl-2 text-xs font-medium text-forest">
                      {s.date.toLocaleDateString("en-GB", { month: mode === "year" ? "short" : "long" })}
                      {mode === "quarter" ? ` ${s.date.getFullYear()}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Room rows */}
          {rooms.map((room, ri) => {
            const lanes = lanesFor(room);
            const pending = cart.filter((c) => c.slug === room.slug);
            const rowH = Math.max(1, lanes.length) * laneH + 10;
            return (
              <div key={room.slug} className="flex border-b border-clay/20 last:border-b-0">
                <div style={{ width: labelW }} className="sticky left-0 z-20 flex shrink-0 items-center gap-2 bg-cream p-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${ROOM_STYLES[ri % 4].split(" ")[0]}`} />
                  <span className="text-sm font-medium leading-tight text-forest">{room.name}</span>
                </div>

                <div
                  className="relative cursor-crosshair touch-pan-x"
                  style={{ width: dayAreaW, height: rowH, ...gridBg }}
                  onPointerDown={(e) => onDown(e, ri)}
                  onPointerMove={(e) => onMove(e, ri)}
                  onPointerUp={(e) => onUp(e, ri)}
                >
                  {cfg.header === "day" &&
                    days.map((d, i) =>
                      d.getDay() === 0 || d.getDay() === 6 ? (
                        <div key={i} className="absolute top-0 bottom-0 bg-sand/40" style={{ left: i * cellW, width: cellW }} />
                      ) : null,
                    )}
                  {cfg.header === "month" &&
                    monthSegs.map((s) =>
                      s.start === 0 ? null : (
                        <div key={s.start} className="absolute top-0 bottom-0 w-px bg-clay/40" style={{ left: s.start * cellW }} />
                      ),
                    )}
                  {todayIdx >= 0 && todayIdx < totalDays && (
                    <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-lake/70" style={{ left: todayIdx * cellW + (cfg.header === "day" ? cellW / 2 : 0) }} />
                  )}

                  {/* booking bars */}
                  {lanes.map((lane, li) =>
                    lane.map((b) => {
                      const s = Math.max(0, dayIndex(b.checkIn));
                      const e = Math.min(totalDays, dayIndex(b.checkOut));
                      if (e <= s) return null;
                      const openL = dayIndex(b.checkIn) < 0;
                      const openR = dayIndex(b.checkOut) > totalDays;
                      return (
                        <div
                          key={b.checkIn + b.name}
                          title={`${b.name}${b.guests > 1 ? ` +${b.guests - 1}` : ""} · ${b.checkIn} → ${b.checkOut}`}
                          style={{ left: s * cellW + 2, width: (e - s) * cellW - 4, top: li * laneH + 5, height: laneH - 6 }}
                          className={`pointer-events-none absolute z-[5] flex items-center overflow-hidden rounded-md px-2 text-xs font-medium ${ROOM_STYLES[ri % 4]} ${openL ? "rounded-l-none" : ""} ${openR ? "rounded-r-none" : ""}`}
                        >
                          <span className="truncate">
                            {b.name}
                            {b.guests > 1 ? ` +${b.guests - 1}` : ""}
                          </span>
                        </div>
                      );
                    }),
                  )}

                  {/* pending (cart) bars */}
                  {pending.map((c) => {
                    const s = Math.max(0, dayIndex(c.checkIn));
                    const e = Math.min(totalDays, dayIndex(c.checkOut));
                    if (e <= s) return null;
                    return (
                      <div
                        key={c.id}
                        title={`Your request · ${c.checkIn} → ${c.checkOut}`}
                        style={{ left: s * cellW + 2, width: (e - s) * cellW - 4, top: 5, height: laneH - 6 }}
                        className={`pointer-events-none absolute z-[7] flex items-center justify-between gap-1 overflow-hidden rounded-md border-2 border-dashed ${ROOM_PENDING[ri % 4]}`}
                      >
                        <span className="truncate pl-1.5 text-[11px] font-semibold">Yours</span>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(c.id);
                          }}
                          aria-label="Remove request"
                          className="pointer-events-auto px-1 text-sm leading-none hover:opacity-70"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {/* drag selection overlay */}
                  {sel && sel.room === ri && (
                    <div
                      className={`pointer-events-none absolute z-[8] rounded-md border-2 border-dashed ${selInfo?.conflict ? "border-red-500 bg-red-500/10" : "border-forest bg-forest/15"}`}
                      style={{
                        left: Math.min(sel.a, sel.b) * cellW + 1,
                        width: (Math.abs(sel.a - sel.b) + 1) * cellW - 2,
                        top: 4,
                        bottom: 4,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current selection */}
      <div className="mt-5">
        {selInfo ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-clay/30 bg-cream p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${ROOM_STYLES[sel!.room % 4].split(" ")[0]}`} />
                <p className="font-display text-xl text-forest">{selInfo.room.name}</p>
              </div>
              <p className="mt-1 text-pine/90">
                {prettyRange(selInfo.checkIn, selInfo.checkOut)} · {selInfo.nights}{" "}
                {selInfo.nights === 1 ? "night" : "nights"}
              </p>
              {selInfo.conflict && (
                <p className="mt-1 text-sm text-red-600">These dates overlap a stay already booked or added.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-pine">
                Guests{" "}
                <select
                  value={Math.min(guests, selInfo.room.sleeps)}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="ml-1 rounded-lg border border-clay/40 bg-white px-2 py-1.5 text-forest outline-none"
                >
                  {Array.from({ length: selInfo.room.sleeps }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button onClick={() => setSel(null)} className="rounded-lg border border-clay/40 px-3 py-2 text-sm text-pine transition hover:bg-sand/60">
                Clear
              </button>
              <button
                onClick={addToCart}
                disabled={selInfo.conflict}
                className="rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-pine disabled:opacity-50"
              >
                Add to requests
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-pine/70">
            {loading
              ? "Loading bookings…"
              : "Drag across a room’s row to pick nights, then add them to your requests — up to 10 stays."}
          </p>
        )}
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
      </div>

      {/* Cart + submit */}
      {cart.length > 0 && (
        <div className="mt-6 rounded-2xl border border-clay/30 bg-cream p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-forest">Your requests</h3>
            <span className="text-sm text-pine/70">
              {cart.length}/{MAX_REQUESTS}
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {cart.map((c) => {
              const ri = rooms.findIndex((r) => r.slug === c.slug);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-clay/30 bg-white/60 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${ROOM_STYLES[ri % 4].split(" ")[0]}`} />
                    <div>
                      <p className="text-sm font-medium text-forest">{c.name}</p>
                      <p className="text-xs text-pine/80">
                        {prettyRange(c.checkIn, c.checkOut)} · {c.nights} {c.nights === 1 ? "night" : "nights"} ·{" "}
                        {c.guests} {c.guests === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(c.id)}
                    aria-label="Remove request"
                    className="rounded-full px-2.5 py-1 text-lg leading-none text-pine/60 transition hover:bg-sand/60 hover:text-forest"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 border-t border-clay/30 pt-5">
            <p className="text-sm font-medium text-forest">Your details</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-pine">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-xs text-pine">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="jane@example.com" />
              </div>
              <div>
                <label className="text-xs text-pine">Phone (optional)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs text-pine">Notes (optional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={field} placeholder="Arrival time, a dog, …" />
              </div>
            </div>

            {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}

            <button
              onClick={submitAll}
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-forest py-3 font-medium text-cream transition hover:bg-pine disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {submitting ? "Sending…" : `Send ${cart.length} booking request${cart.length === 1 ? "" : "s"}`}
            </button>
            <p className="mt-3 text-xs text-pine/60">These are requests, not confirmed bookings. We&apos;ll email you back.</p>
          </div>
        </div>
      )}
    </div>
  );
}
