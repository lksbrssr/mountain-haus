"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReservation } from "@/lib/reservations";

type RoomRef = { slug: string; name: string };
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  const cfg = MODES.find((m) => m.key === mode)!;
  const cellW = cfg.cellW;
  const anchor = parse(anchorISO);
  const todayISO = toISO(new Date());
  const labelW = 128;
  const laneH = 30;

  const { windowStart, totalDays } = useMemo(() => {
    const y = anchor.getFullYear();
    const mo = anchor.getMonth();
    if (mode === "week") return { windowStart: mondayOf(anchor), totalDays: 7 };
    if (mode === "fortnight") return { windowStart: mondayOf(anchor), totalDays: 14 };
    if (mode === "month") return { windowStart: new Date(y, mo, 1), totalDays: daysInMonth(y, mo) };
    if (mode === "quarter") {
      const qm = Math.floor(mo / 3) * 3;
      return {
        windowStart: new Date(y, qm, 1),
        totalDays: daysInMonth(y, qm) + daysInMonth(y, qm + 1) + daysInMonth(y, qm + 2),
      };
    }
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return { windowStart: new Date(y, 0, 1), totalDays: leap ? 366 : 365 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchorISO]);

  const windowStartISO = toISO(windowStart);
  const windowEndISO = toISO(addDays(windowStart, totalDays));
  const dayAreaW = totalDays * cellW;
  const dayIndex = (iso: string) => Math.round((parse(iso).getTime() - windowStart.getTime()) / DAY);
  const todayIdx = dayIndex(todayISO);
  const days = Array.from({ length: totalDays }, (_, i) => addDays(windowStart, i));

  // month bands (for quarter/year header + boundary lines)
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
  }, [mode, anchorISO]);

  // center today (or window) when the view changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = todayIdx >= 0 && todayIdx < totalDays
      ? Math.max(0, labelW + todayIdx * cellW - el.clientWidth / 2)
      : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchorISO, loading]);

  function shift(dir: number) {
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

  const btn = "rounded-lg px-3 py-1.5 text-sm transition";
  const gridBg = { backgroundImage: `repeating-linear-gradient(to right, ${GRID} 0 1px, transparent 1px ${cellW}px)` };

  return (
    <div className="mt-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className={`${btn} border border-clay/40 hover:bg-cream`} aria-label="Previous">←</button>
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

          {/* Rows */}
          {rooms.map((room, ri) => {
            const lanes = lanesFor(room);
            const rowH = Math.max(1, lanes.length) * laneH + 10;
            return (
              <div key={room.slug} className="flex border-b border-clay/20 last:border-b-0">
                <div style={{ width: labelW }} className="sticky left-0 z-20 flex shrink-0 items-center gap-2 bg-cream p-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${ROOM_STYLES[ri % 4].split(" ")[0]}`} />
                  <span className="text-sm font-medium leading-tight text-forest">{room.name}</span>
                </div>

                <div className="relative" style={{ width: dayAreaW, height: rowH, ...gridBg }}>
                  {/* weekend shading (day modes only) */}
                  {cfg.header === "day" &&
                    days.map((d, i) =>
                      d.getDay() === 0 || d.getDay() === 6 ? (
                        <div key={i} className="absolute top-0 bottom-0 bg-sand/40" style={{ left: i * cellW, width: cellW }} />
                      ) : null,
                    )}
                  {/* month boundary lines (month modes) */}
                  {cfg.header === "month" &&
                    monthSegs.map((s) =>
                      s.start === 0 ? null : (
                        <div key={s.start} className="absolute top-0 bottom-0 w-px bg-clay/40" style={{ left: s.start * cellW }} />
                      ),
                    )}
                  {/* today line */}
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
                          className={`absolute z-[5] flex items-center overflow-hidden rounded-md px-2 text-xs font-medium ${ROOM_STYLES[ri % 4]} ${openL ? "rounded-l-none" : ""} ${openR ? "rounded-r-none" : ""}`}
                        >
                          <span className="truncate">
                            {b.name}
                            {b.guests > 1 ? ` +${b.guests - 1}` : ""}
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-pine/80">
        <p>
          {loading
            ? "Loading bookings…"
            : reservations.length === 0
              ? "No bookings yet — every room is open. Scroll to pan; use the zoom buttons to change range."
              : "Bars are requested stays; empty space is free. Scroll to pan, zoom to change range."}
        </p>
        <Link href="/#rooms" className="text-lake underline">Request a stay →</Link>
      </div>
    </div>
  );
}
