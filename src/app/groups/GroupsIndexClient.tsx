"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createGroup,
  GROUPS_API,
  listGroups,
  type GroupSummary,
} from "@/lib/groups";
import {
  formatWeekend,
  groupByMonth,
  MAX_WEEKENDS,
  upcomingWeekends,
  weekendAvailability,
  type WeekendOption,
} from "@/lib/weekends";
import { longWeekend } from "@/lib/holidays";
import type { PublicReservation } from "@/lib/reservations";
import { rooms } from "@/lib/rooms";

const NAME_KEY = "haus-group-name";
const TOTAL_ROOMS = rooms.filter((r) => !r.underConstruction).length;

export function GroupsIndexClient() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [openMonth, setOpenMonth] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const months = useMemo(() => groupByMonth(upcomingWeekends(12)), []);
  const byId = useMemo(() => {
    const m = new Map<string, WeekendOption>();
    for (const grp of months) for (const w of grp.weekends) m.set(w.id, w);
    return m;
  }, [months]);

  useEffect(() => {
    if (months.length && !openMonth) setOpenMonth(months[0].key);
  }, [months, openMonth]);

  useEffect(() => {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) setName(n);
    } catch {
      /* ignore */
    }
    // Existing bookings — so we can grey out weekends the haus is already taken.
    fetch("/api/reservations")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]));
    if (!GROUPS_API) {
      setGroups([]);
      return;
    }
    listGroups()
      .then(setGroups)
      .catch(() => setLoadError("Couldn't load existing groups."));
  }, [months]);

  function togglePick(id: string) {
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_WEEKENDS
          ? prev
          : [...prev, id],
    );
  }

  const pickedWeekends = useMemo(
    () =>
      picked
        .map((id) => byId.get(id))
        .filter((w): w is WeekendOption => Boolean(w))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [picked, byId],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const organizer = name.trim();
    const t = title.trim();
    if (!organizer) return setCreateError("Add your name first.");
    if (!t) return setCreateError("Give your group a name.");
    if (pickedWeekends.length === 0)
      return setCreateError("Pick at least one weekend.");
    try {
      localStorage.setItem(NAME_KEY, organizer);
    } catch {
      /* ignore */
    }
    setCreating(true);
    try {
      const group = await createGroup({
        title: t,
        organizer,
        weekends: pickedWeekends,
      });
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setCreateError((err as Error).message);
      setCreating(false);
    }
  }

  const openGroup = months.find((m) => m.key === openMonth);

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-8 pt-16">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
          The Haus · Group booking
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-5xl leading-[1.05] text-forest sm:text-6xl">
          Find a weekend that works
        </h1>
        <p className="mt-4 max-w-xl text-pine/90">
          Doodle-style, but for the haus. Start a group, pick a few candidate
          weekends, share the link, and everyone drops their availability. The
          weekend that works for the most people floats to the top.
        </p>
      </section>

      {/* Create a group */}
      <section className="bg-sand/40 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <form
            onSubmit={onCreate}
            className="rounded-3xl border border-clay/25 bg-cream p-6 sm:p-8"
          >
            <h2 className="font-display text-2xl text-forest">Start a group</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-pine">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lukas"
                  className="mt-1 w-full rounded-xl border border-clay/30 bg-white px-4 py-2.5 text-forest outline-none focus:border-forest/50"
                />
              </label>
              <label className="block">
                <span className="text-sm text-pine">Group / trip name</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ski weekend with the gang"
                  className="mt-1 w-full rounded-xl border border-clay/30 bg-white px-4 py-2.5 text-forest outline-none focus:border-forest/50"
                />
              </label>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-pine">
                  Candidate weekends{" "}
                  <span className="text-clay">
                    (pick up to {MAX_WEEKENDS}, any month in the next year)
                  </span>
                </span>
                <span className="text-xs text-clay">
                  {picked.length}/{MAX_WEEKENDS}
                </span>
              </div>

              {/* Month tabs — months with picks show a count dot. */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {months.map((m) => {
                  const count = m.weekends.filter((w) =>
                    picked.includes(w.id),
                  ).length;
                  const active = m.key === openMonth;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setOpenMonth(m.key)}
                      className={`relative shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-forest bg-forest text-cream"
                          : count > 0
                            ? "border-forest/40 bg-forest/10 text-forest"
                            : "border-clay/30 bg-white text-pine hover:border-forest/40"
                      }`}
                    >
                      {m.short}
                      {count > 0 && (
                        <span
                          className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold ${
                            active ? "bg-cream text-forest" : "bg-forest text-cream"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Weekends in the open month. */}
              {openGroup && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {openGroup.weekends.map((w) => {
                    const on = picked.includes(w.id);
                    const full = !on && picked.length >= MAX_WEEKENDS;
                    const f = formatWeekend(w);
                    const lw = longWeekend(w.start, w.end);
                    const avail = weekendAvailability(w, reservations, TOTAL_ROOMS);
                    const booked = avail.fullyBooked;
                    const disabled = full || booked;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => togglePick(w.id)}
                        disabled={disabled}
                        title={
                          booked
                            ? `Fully booked — all ${avail.totalRooms} rooms taken: ${avail.blocking
                                .map((c) => `${c.name} (${c.room})`)
                                .join(", ")}`
                            : avail.freeRooms < avail.totalRooms
                              ? `${avail.freeRooms} of ${avail.totalRooms} rooms free`
                              : lw.isLong
                                ? lw.title
                                : undefined
                        }
                        className={`relative rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                          booked
                            ? "cursor-not-allowed border-clay/20 bg-sand/50 text-pine/40"
                            : full
                              ? "cursor-not-allowed border-clay/20 bg-white/50 text-pine/40"
                              : on
                                ? lw.isLong
                                  ? "border-[#c6952e] bg-forest text-cream ring-2 ring-[#c6952e]/40"
                                  : "border-forest bg-forest text-cream"
                                : lw.isLong
                                  ? "border-[#c6952e] bg-[#c6952e]/5 text-forest hover:bg-[#c6952e]/10"
                                  : "border-forest/30 bg-white text-forest hover:border-forest"
                        }`}
                      >
                        {lw.isLong && !booked && (
                          <span
                            className="pointer-events-none absolute -right-1.5 -top-1.5 text-sm"
                            aria-hidden
                          >
                            ✨
                          </span>
                        )}
                        <span className="block text-[0.7rem] uppercase tracking-wide opacity-70">
                          {f.weekday}
                        </span>
                        <span className="block font-display text-lg leading-tight">
                          {f.range}
                        </span>
                        {booked ? (
                          <span className="mt-0.5 block text-[0.65rem] font-medium text-[#b5552f]/80 line-through">
                            Fully booked
                          </span>
                        ) : lw.isLong ? (
                          <span
                            className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                              on ? "bg-[#c6952e] text-cream" : "bg-[#c6952e]/15 text-[#a97e24]"
                            }`}
                          >
                            Long weekend · {lw.tag}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[0.65rem] opacity-0">
                            .
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Running summary of everything picked across months. */}
              {pickedWeekends.length > 0 && (
                <div className="mt-5 rounded-2xl border border-clay/25 bg-white/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-clay">
                    Your weekends
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pickedWeekends.map((w) => {
                      const f = formatWeekend(w);
                      const lw = longWeekend(w.start, w.end);
                      return (
                        <span
                          key={w.id}
                          className="inline-flex items-center gap-2 rounded-full bg-forest/10 py-1.5 pl-3 pr-1.5 text-sm text-forest"
                        >
                          {f.range} {f.month}
                          {lw.isLong && (
                            <span title={lw.title} aria-hidden>
                              ✨
                            </span>
                          )}
                          <button
                            type="button"
                            aria-label="Remove weekend"
                            onClick={() => togglePick(w.id)}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-forest/15 text-xs text-forest transition hover:bg-forest hover:text-cream"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.7rem] text-clay">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded border-2 border-forest/40" />
                  weekend
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded border-2 border-[#c6952e]" />
                  ✨ long weekend (public holiday alongside)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="line-through">Fully booked</span> = all rooms
                  taken (the group&apos;s own bookings don&apos;t count)
                </span>
              </p>
            </div>

            {createError && (
              <p className="mt-4 text-sm text-[#b5552f]">{createError}</p>
            )}
            {!GROUPS_API && (
              <p className="mt-4 text-sm text-[#b5552f]">
                Sharing backend isn&apos;t configured, so groups can&apos;t be
                saved yet.
              </p>
            )}

            <button
              type="submit"
              disabled={creating || !GROUPS_API}
              className="mt-6 rounded-full bg-forest px-6 py-3 font-medium text-cream transition hover:brightness-110 disabled:opacity-40"
            >
              {creating ? "Creating…" : "Create group & share"}
            </button>
          </form>
        </div>
      </section>

      {/* Existing groups */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-display text-2xl text-forest">Open groups</h2>
        {loadError && <p className="mt-3 text-sm text-[#b5552f]">{loadError}</p>}
        {groups === null ? (
          <p className="mt-3 text-sm text-pine/60">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="mt-3 text-sm text-pine/60">
            No groups yet — start one above.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="group block rounded-2xl border border-clay/25 bg-cream p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <h3 className="font-display text-xl text-forest">{g.title}</h3>
                <p className="mt-1 text-sm text-pine/80">
                  by {g.organizer} · {g.weekends.length} weekend
                  {g.weekends.length === 1 ? "" : "s"} · {g.people} in
                </p>
                <span className="mt-3 inline-block text-sm text-lake transition group-hover:underline">
                  Open & drop availability →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
