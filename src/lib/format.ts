export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  const n = Math.round(ms / 86_400_000);
  return n > 0 ? n : 0;
}

export function prettyDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function reference(): string {
  return "HAUS-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}
