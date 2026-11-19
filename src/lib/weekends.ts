// Weekend helpers for the Group Booking feature — a Doodle-style availability
// poll. Anyone can create a group, pick up to 7 candidate weekends across the
// next ~12 months, share the link, and everyone drops their availability.

import { rangesOverlap } from "@/lib/format";
import type { PublicReservation } from "@/lib/reservations";

export type WeekendOption = {
  // Stable identifier, derived from the Friday date. Keyed on when voting.
  id: string;
  // ISO date (YYYY-MM-DD) of the Friday the weekend starts.
  start: string;
  // ISO date (YYYY-MM-DD) of the Sunday it ends.
  end: string;
  // Optional short note (e.g. "School holidays").
  note?: string;
};

// Availability a person can mark for a given weekend.
export type Availability = "yes" | "maybe" | "no";

export const MAX_WEEKENDS = 7;

function iso(d: Date): string {
  // Local-date ISO (avoid toISOString's UTC shift pushing Fri back to Thu).
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Every Fri–Sun weekend across the next `months` months (default 12),
// starting from the upcoming Friday. Used to populate the weekend picker.
export function upcomingWeekends(months = 12, from = new Date()): WeekendOption[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // Advance to the next Friday (getDay(): Fri = 5).
  const d = new Date(today);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + months);

  const out: WeekendOption[] = [];
  const fri = new Date(d);
  while (fri <= horizon) {
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    out.push({ id: `w-${iso(fri)}`, start: iso(fri), end: iso(sun) });
    fri.setDate(fri.getDate() + 7);
  }
  return out;
}

export type MonthGroup = {
  key: string; // "2026-11"
  label: string; // "November 2026"
  short: string; // "Nov '26"
  weekends: WeekendOption[];
};

export function monthKeyOf(w: WeekendOption): string {
  return w.start.slice(0, 7);
}

// Group weekends by the month their Friday falls in.
export function groupByMonth(weekends: WeekendOption[]): MonthGroup[] {
  const groups = new Map<string, WeekendOption[]>();
  for (const w of weekends) {
    const key = monthKeyOf(w);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(w);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ws]) => {
      const d = new Date(`${key}-01T00:00:00`);
      return {
        key,
        label: new Intl.DateTimeFormat("en-GB", {
          month: "long",
          year: "numeric",
        }).format(d),
        short: `${new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d)} '${key.slice(2, 4)}`,
        weekends: ws,
      };
    });
}

// Reservations that overlap a weekend (Fri, Sat & Sun nights → checkout Mon).
export function weekendConflicts(
  w: WeekendOption,
  reservations: PublicReservation[],
): PublicReservation[] {
  const checkout = (() => {
    const d = new Date(`${w.end}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return iso(d);
  })();
  return reservations.filter((r) =>
    rangesOverlap(w.start, checkout, r.checkIn, r.checkOut),
  );
}

// "Fri–Sun" / "9–11" / "Jan" parts for a weekend label.
export function formatWeekend(w: WeekendOption): {
  weekday: string;
  range: string;
  month: string;
} {
  const s = new Date(`${w.start}T00:00:00`);
  const e = new Date(`${w.end}T00:00:00`);
  const day = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);
  const dn = (d: Date) => d.getDate();
  const mon = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
  const sameMonth = s.getMonth() === e.getMonth();
  const range = sameMonth
    ? `${dn(s)}–${dn(e)}`
    : `${dn(s)} ${mon(s)} – ${dn(e)} ${mon(e)}`;
  return {
    weekday: `${day(s)}–${day(e)}`,
    range,
    month: sameMonth ? mon(s) : `${mon(s)}/${mon(e)}`,
  };
}
