"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReservation } from "@/lib/reservations";
import { prettyRange, rangesOverlap } from "@/lib/format";

type RoomRef = { slug: string; name: string; sleeps: number };
type Mode = "week" | "fortnight" | "month" | "quarter" | "year";

const ROOM_STYLES = [
  "bg-lake text-cream",
  "bg-pine text-cream",
  "bg-clay text-forest",
  "bg-forest text-cream",
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

  // Natural window for the mode, then clamp so the past is never shown.
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

  // reset selection + center today when the view changes
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
    if (dir < 0 && atStart) return; // never page into the past
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
    const conflict = reservations.some(
      (r) => r.room === room.name && rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut),
    );
    return { room, checkIn, checkOut, nights, conflict };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, anchorISO, mode, reservations]);

  const btn = "rounded-lg px-3 py-1.5 text-sm transition";
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
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`${btn} ${mode === m.key ? "bg-forest text-cream" : "text-pine hover:bg-sand/60"}`}
            >
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

      {/* Selection summary */}
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
                <p className="mt-1 text-sm text-red-600">
                  These dates overlap an existing stay — try another range.
                </p>
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
              {selInfo.conflict ? (
                <span className="rounded-lg bg-clay/30 px-4 py-2 text-sm text-pine/70">Unavailable</span>
              ) : (
                <Link
                  href={`/rooms/${selInfo.room.slug}/book?in=${selInfo.checkIn}&out=${selInfo.checkOut}&guests=${Math.min(guests, selInfo.room.sleeps)}`}
                  className="rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-pine"
                >
                  Request this stay →
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-pine/70">
            {loading
              ? "Loading bookings…"
              : "Drag across a room’s row to pick the nights you’d like — your request will appear here."}
          </p>
        )}
      </div>
    </div>
  );
}
