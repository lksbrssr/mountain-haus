// Weekend helpers for the Group Booking feature — a Doodle-style availability
// poll. Anyone can create a group, pick up to 7 candidate weekends, share the
// link, and everyone drops their availability to find a date that works.
//
// Groups (and the weekends each one offers) are created at runtime and stored
// on the shared backend; this file only provides the date helpers.

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

// The next `count` Fri–Sun weekends starting from (or after) `from`.
// Used to populate the "pick your weekends" picker when creating a group.
export function upcomingWeekends(count = 12, from = new Date()): WeekendOption[] {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // Advance to the next Friday (getDay(): Fri = 5).
  const delta = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  const out: WeekendOption[] = [];
  for (let i = 0; i < count; i++) {
    const fri = new Date(d);
    fri.setDate(d.getDate() + i * 7);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    out.push({ id: `w-${iso(fri)}`, start: iso(fri), end: iso(sun) });
  }
  return out;
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
