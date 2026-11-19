// German public holidays (Bavaria / Bayern — the haus is in Bayrischzell, a
// Catholic municipality, so Mariä Himmelfahrt counts). Used to flag weekends
// that butt up against a holiday as "long weekends".

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Easter Sunday (Gregorian) via the Anonymous algorithm → [month, day].
function easter(year: number): { m: number; d: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: month, d: day };
}

function addDaysISO(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const cache = new Map<number, Map<string, string>>();

// Map of ISO date → holiday name, for Bavaria, for a given year.
export function holidaysForYear(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;

  const e = easter(year);
  const easterISO = iso(year, e.m, e.d);
  const map = new Map<string, string>([
    [iso(year, 1, 1), "Neujahr"],
    [iso(year, 1, 6), "Heilige Drei Könige"],
    [addDaysISO(easterISO, -2), "Karfreitag"],
    [addDaysISO(easterISO, 1), "Ostermontag"],
    [iso(year, 5, 1), "Tag der Arbeit"],
    [addDaysISO(easterISO, 39), "Christi Himmelfahrt"],
    [addDaysISO(easterISO, 50), "Pfingstmontag"],
    [addDaysISO(easterISO, 60), "Fronleichnam"],
    [iso(year, 8, 15), "Mariä Himmelfahrt"],
    [iso(year, 10, 3), "Tag der Deutschen Einheit"],
    [iso(year, 11, 1), "Allerheiligen"],
    [iso(year, 12, 25), "1. Weihnachtstag"],
    [iso(year, 12, 26), "2. Weihnachtstag"],
  ]);
  cache.set(year, map);
  return map;
}

export function holidayOn(isoDate: string): string | null {
  const year = Number(isoDate.slice(0, 4));
  return holidaysForYear(year).get(isoDate) ?? null;
}

export type LongWeekend = {
  isLong: boolean;
  // Short tag, e.g. "+ Mon off".
  tag: string;
  // Full tooltip, e.g. "Pfingstmontag (Mon) — long weekend".
  title: string;
};

// Does a Fri–Sun weekend touch a public holiday? We look at the Thursday
// before (a bridge-day Friday), the Friday itself, and the Monday after.
export function longWeekend(startISO: string, endISO: string): LongWeekend {
  const checks: { date: string; day: string; tag: string }[] = [
    { date: addDaysISO(startISO, -1), day: "Thu", tag: "+ Thu" },
    { date: startISO, day: "Fri", tag: "Fri off" },
    { date: addDaysISO(endISO, 1), day: "Mon", tag: "+ Mon off" },
  ];
  const hits = checks
    .map((c) => ({ ...c, name: holidayOn(c.date) }))
    .filter((c): c is typeof c & { name: string } => Boolean(c.name));

  if (hits.length === 0) return { isLong: false, tag: "", title: "" };
  // Prefer the Monday extension as the headline tag if present.
  const headline = hits.find((h) => h.day === "Mon") ?? hits[0];
  return {
    isLong: true,
    tag: headline.tag,
    title: hits.map((h) => `${h.name} (${h.day})`).join(" · ") + " — long weekend",
  };
}
