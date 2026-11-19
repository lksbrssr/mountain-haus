"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteGroup,
  getGroup,
  GROUPS_API,
  removePerson,
  setAvailability,
  type Group,
} from "@/lib/groups";
import {
  formatWeekend,
  monthKeyOf,
  weekendAvailability,
  type Availability,
} from "@/lib/weekends";
import { longWeekend } from "@/lib/holidays";
import type { PublicReservation } from "@/lib/reservations";
import { rooms } from "@/lib/rooms";

const NAME_KEY = "haus-group-name";
const TOTAL_ROOMS = rooms.filter((r) => !r.underConstruction).length;

function monthLabelOf(key: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${key}-01T00:00:00`));
}

const CYCLE: (Availability | null)[] = [null, "yes", "maybe", "no"];
const nextState = (s: Availability | undefined | null): Availability | null =>
  CYCLE[(CYCLE.indexOf(s ?? null) + 1) % CYCLE.length];

const CELL: Record<Availability, { label: string; cls: string }> = {
  yes: { label: "✓", cls: "bg-forest text-cream" },
  maybe: { label: "~", cls: "bg-clay/30 text-forest ring-1 ring-clay/50" },
  no: { label: "✕", cls: "bg-ink/70 text-cream" },
};

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
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 1).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function GroupClient({ id }: { id: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identity, setIdentity] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);

  const [selected, setSelected] = useState<string[]>([]); // flexible-finder
  const [copied, setCopied] = useState(false);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);

  const refresh = useCallback(async () => {
    try {
      const g = await getGroup(id);
      setGroup(g);
      setError(g ? null : "This group doesn't exist (or was deleted).");
    } catch {
      setError("Couldn't load this group.");
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) {
        setIdentity(n);
        setNameDraft(n);
      }
    } catch {
      /* ignore */
    }
    refresh();
    // Existing bookings, to flag weekends the haus is already taken.
    fetch("/api/reservations")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setReservations(d.reservations ?? []))
      .catch(() => setReservations([]));
    // Light polling so everyone sees new responses roll in.
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  function saveIdentity(name: string) {
    const clean = name.trim().slice(0, 80);
    if (!clean) return;
    setIdentity(clean);
    setEditingName(false);
    try {
      localStorage.setItem(NAME_KEY, clean);
    } catch {
      /* ignore */
    }
  }

  const people = useMemo(() => {
    if (!group) return [];
    const names = Object.keys(group.availability);
    // Organizer first, then me, then alphabetical.
    return names.sort((a, b) => {
      if (a === group.organizer) return -1;
      if (b === group.organizer) return 1;
      if (a === identity) return -1;
      if (b === identity) return 1;
      return a.localeCompare(b);
    });
  }, [group, identity]);

  const joined = Boolean(identity && group?.availability[identity]);

  async function cycle(weekendId: string) {
    if (!group || !identity) {
      setEditingName(true);
      return;
    }
    const current = group.availability[identity]?.[weekendId] ?? null;
    const next = nextState(current);
    // Optimistic update.
    setGroup((g) => {
      if (!g) return g;
      const avail = { ...g.availability };
      const mine = { ...(avail[identity] ?? {}) };
      if (next === null) delete mine[weekendId];
      else mine[weekendId] = next;
      avail[identity] = mine;
      return { ...g, availability: avail };
    });
    try {
      await setAvailability(group.id, identity, weekendId, next);
    } catch {
      refresh();
    }
  }

  async function join() {
    if (!group || !identity) {
      setEditingName(true);
      return;
    }
    // Default to "yes" on the first weekend so you appear on the board.
    const first = group.weekends[0];
    if (first) await cycleTo(first.id, "yes");
  }

  async function cycleTo(weekendId: string, state: Availability) {
    if (!group || !identity) return;
    setGroup((g) => {
      if (!g) return g;
      const avail = { ...g.availability };
      avail[identity] = { ...(avail[identity] ?? {}), [weekendId]: state };
      return { ...g, availability: avail };
    });
    try {
      await setAvailability(group.id, identity, weekendId, state);
    } catch {
      refresh();
    }
  }

  async function leave() {
    if (!group || !identity) return;
    setGroup((g) => {
      if (!g) return g;
      const avail = { ...g.availability };
      delete avail[identity];
      return { ...g, availability: avail };
    });
    try {
      await removePerson(group.id, identity);
    } catch {
      refresh();
    }
  }

  async function onDeleteGroup() {
    if (!group || identity !== group.organizer) return;
    if (!confirm("Delete this whole group for everyone?")) return;
    await deleteGroup(group.id, identity);
    window.location.href = "/groups";
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  function toggleSelected(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  }

  // Per-weekend tallies + a score for ranking.
  const stats = useMemo(() => {
    if (!group) return [];
    return group.weekends.map((w) => {
      let yes = 0,
        maybe = 0,
        no = 0;
      const yesNames: string[] = [];
      for (const [person, states] of Object.entries(group.availability)) {
        const s = states[w.id];
        if (s === "yes") {
          yes++;
          yesNames.push(person);
        } else if (s === "maybe") maybe++;
        else if (s === "no") no++;
      }
      // Works for the flexible selection if nobody selected said "no" and
      // everyone selected has marked something (yes/maybe).
      let fit: "clear" | "possible" | "none" = "none";
      if (selected.length > 0) {
        const states = selected.map((p) => group.availability[p]?.[w.id]);
        if (states.every((s) => s === "yes")) fit = "clear";
        else if (states.every((s) => s === "yes" || s === "maybe"))
          fit = "possible";
      }
      return { w, yes, maybe, no, yesNames, score: yes * 2 + maybe, fit };
    });
  }, [group, selected]);

  const bestScore = useMemo(
    () => stats.reduce((m, s) => Math.max(m, s.score), 0),
    [stats],
  );

  // Long-weekend + whole-haus availability per weekend id.
  const weekMeta = useMemo(() => {
    const m = new Map<
      string,
      {
        lw: ReturnType<typeof longWeekend>;
        avail: ReturnType<typeof weekendAvailability>;
      }
    >();
    if (!group) return m;
    for (const w of group.weekends) {
      m.set(w.id, {
        lw: longWeekend(w.start, w.end),
        avail: weekendAvailability(w, reservations, TOTAL_ROOMS),
      });
    }
    return m;
  }, [group, reservations]);

  // Contiguous month spans, so the header can group weekends by month.
  const monthSpans = useMemo(() => {
    const spans: { key: string; label: string; span: number }[] = [];
    if (!group) return spans;
    for (const w of group.weekends) {
      const key = monthKeyOf(w);
      const last = spans[spans.length - 1];
      if (last && last.key === key) last.span++;
      else spans.push({ key, label: monthLabelOf(key), span: 1 });
    }
    return spans;
  }, [group]);

  if (!loaded)
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 text-center text-pine/60">
        Loading…
      </section>
    );

  if (error || !group)
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-pine/80">{error || "Group not found."}</p>
        <a
          href="/groups"
          className="mt-4 inline-block rounded-full bg-forest px-5 py-2.5 text-sm text-cream"
        >
          ← Back to groups
        </a>
      </section>
    );

  const isOrganizer = identity === group.organizer;

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-8 pt-14">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
          Group booking · by {group.organizer}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-forest sm:text-5xl">
          {group.title}
        </h1>

        {/* Identity + share */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {identity && !editingName ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-4 py-2 text-forest">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-semibold text-cream ${avatarColor(
                  identity,
                )}`}
              >
                {initialsOf(identity)}
              </span>
              You&apos;re <b className="font-semibold">{identity}</b>
            </span>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveIdentity(nameDraft);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus={editingName}
                placeholder="Your name"
                className="w-44 rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine outline-none focus:border-forest/50"
              />
              <button
                type="submit"
                disabled={!nameDraft.trim()}
                className="rounded-full bg-forest px-4 py-2 font-medium text-cream disabled:opacity-40"
              >
                Save
              </button>
            </form>
          )}
          {identity && !editingName && (
            <button
              type="button"
              onClick={() => {
                setNameDraft(identity);
                setEditingName(true);
              }}
              className="rounded-full border border-clay/30 px-3 py-2 text-pine transition hover:border-forest/40"
            >
              Change
            </button>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="ml-auto rounded-full border border-clay/30 px-4 py-2 text-forest transition hover:border-forest/40"
          >
            {copied ? "Link copied ✓" : "🔗 Copy invite link"}
          </button>
        </div>

        {identity && !joined && (
          <button
            type="button"
            onClick={join}
            className="mt-4 rounded-full bg-lake px-5 py-2.5 text-sm font-medium text-cream transition hover:brightness-110"
          >
            Join this group
          </button>
        )}
      </section>

      {/* Availability board */}
      <section className="bg-sand/40 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-center gap-4 text-xs text-pine/80">
            <span className="font-medium text-forest">
              Tap a cell in your row to set it:
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="flex h-5 w-5 items-center justify-center rounded bg-forest text-[0.7rem] text-cream not-italic">
                ✓
              </i>
              Yes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="flex h-5 w-5 items-center justify-center rounded bg-clay/30 text-[0.7rem] text-forest ring-1 ring-clay/50 not-italic">
                ~
              </i>
              Maybe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="flex h-5 w-5 items-center justify-center rounded bg-ink/70 text-[0.7rem] text-cream not-italic">
                ✕
              </i>
              No
            </span>
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-clay/25 bg-cream">
            <table className="w-full border-collapse text-sm">
              <thead>
                {/* Month group row — highlights which months have options. */}
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 min-w-[9rem] border-r border-clay/15 bg-cream px-4 py-3 text-left align-bottom font-medium text-clay"
                  >
                    Who
                  </th>
                  {monthSpans.map((s) => (
                    <th
                      key={s.key}
                      colSpan={s.span}
                      className="border-b border-clay/15 bg-forest/5 px-2 py-2 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-forest"
                    >
                      {s.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {stats.map(({ w, score, fit }) => {
                    const f = formatWeekend(w);
                    const isBest = score > 0 && score === bestScore;
                    const meta = weekMeta.get(w.id);
                    const booked = meta?.avail.fullyBooked ?? false;
                    const partial =
                      !!meta && !booked && meta.avail.freeRooms < meta.avail.totalRooms;
                    const takenBy = meta?.avail.blocking
                      .map((c) => `${c.name} (${c.room})`)
                      .join(", ");
                    return (
                      <th
                        key={w.id}
                        title={
                          booked
                            ? `Fully booked — all ${meta!.avail.totalRooms} rooms taken: ${takenBy}`
                            : partial
                              ? `${meta!.avail.freeRooms} of ${meta!.avail.totalRooms} rooms free — ${takenBy} already booked`
                              : meta?.lw.isLong
                                ? meta.lw.title
                                : undefined
                        }
                        className={`min-w-[5.5rem] px-2 py-3 text-center align-bottom ${
                          !booked && meta?.lw.isLong
                            ? "border-t-2 border-t-[#c6952e]"
                            : ""
                        } ${
                          booked
                            ? "bg-sand/50"
                            : fit === "clear"
                              ? "bg-forest/15"
                              : fit === "possible"
                                ? "bg-clay/15"
                                : isBest
                                  ? "bg-lake/10"
                                  : ""
                        }`}
                      >
                        <span className="block text-[0.65rem] uppercase tracking-wide text-clay">
                          {f.weekday}
                        </span>
                        <span
                          className={`block font-display text-base leading-tight ${booked ? "text-pine/40 line-through" : "text-forest"}`}
                        >
                          {f.range}
                        </span>
                        {w.note && (
                          <span className="mt-1 block text-[0.6rem] text-clay">
                            {w.note}
                          </span>
                        )}
                        {booked ? (
                          <span className="mt-1 inline-block rounded-full bg-[#b5552f]/15 px-2 py-0.5 text-[0.6rem] font-medium text-[#b5552f]">
                            Fully booked
                          </span>
                        ) : (
                          <>
                            {partial && (
                              <span className="mt-1 inline-block rounded-full bg-[#c0702f]/15 px-2 py-0.5 text-[0.6rem] font-medium text-[#b5552f]">
                                {meta!.avail.freeRooms}/{meta!.avail.totalRooms} rooms left
                              </span>
                            )}
                            {meta?.lw.isLong && (
                              <span className="mt-1 inline-block rounded-full bg-[#c6952e]/15 px-2 py-0.5 text-[0.6rem] font-medium text-[#a97e24]">
                                ✨ {meta.lw.tag}
                              </span>
                            )}
                          </>
                        )}
                        {isBest && !booked && (
                          <span className="mt-1 block">
                            <span className="inline-block rounded-full bg-lake px-2 py-0.5 text-[0.6rem] font-medium text-cream">
                              Best
                            </span>
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {people.map((person) => {
                  const mine = person === identity;
                  return (
                    <tr
                      key={person}
                      className={`border-t border-clay/15 ${mine ? "bg-forest/5" : ""}`}
                    >
                      <td
                        className={`sticky left-0 z-10 border-r border-clay/15 px-4 py-2 ${mine ? "bg-[#ece8de]" : "bg-cream"}`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-cream ${avatarColor(
                              person,
                            )}`}
                          >
                            {initialsOf(person)}
                          </span>
                          <span className="font-medium text-forest">
                            {person}
                            {person === group.organizer && (
                              <span className="ml-1 text-[0.65rem] text-clay">
                                host
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      {group.weekends.map((w) => {
                        const s = group.availability[person]?.[w.id];
                        const cell = s ? CELL[s] : null;
                        return (
                          <td key={w.id} className="px-2 py-2 text-center">
                            <button
                              type="button"
                              disabled={!mine}
                              onClick={() => mine && cycle(w.id)}
                              aria-label={`${person} ${w.id} ${s ?? "none"}`}
                              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                                cell
                                  ? cell.cls
                                  : "bg-white text-clay/40 ring-1 ring-clay/20"
                              } ${mine ? "cursor-pointer hover:brightness-105" : "cursor-default"}`}
                            >
                              {cell ? cell.label : mine ? "+" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Tallies */}
                <tr className="border-t-2 border-clay/30 bg-sand/40">
                  <td className="sticky left-0 z-10 border-r border-clay/15 bg-[#f1e9db] px-4 py-3 text-xs font-medium text-pine">
                    Available (✓ / ~)
                  </td>
                  {stats.map((st) => (
                    <td
                      key={st.w.id}
                      className="px-2 py-3 text-center text-sm font-semibold text-forest"
                    >
                      {st.yes}
                      {st.maybe > 0 && (
                        <span className="text-clay"> / {st.maybe}</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {identity && joined && (
            <button
              type="button"
              onClick={leave}
              className="mt-4 text-sm text-clay underline underline-offset-2 transition hover:text-[#b5552f]"
            >
              Remove me from this group
            </button>
          )}
        </div>
      </section>

      {/* Flexible finder */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-display text-2xl text-forest">
          Find a weekend for a specific crew
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-pine/90">
          If some of you are flexible, pick just the people who need to be there.
          Weekends where <b>everyone picked</b> is free light up green (all yes)
          or amber (works if the maybes come through).
        </p>

        {people.length === 0 ? (
          <p className="mt-4 text-sm text-pine/60">No one&apos;s joined yet.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {people.map((p) => {
                const on = selected.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleSelected(p)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      on
                        ? "border-forest bg-forest text-cream"
                        : "border-clay/30 bg-cream text-forest hover:border-forest/40"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-full px-3 py-2 text-sm text-clay underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>

            {selected.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {stats.filter((s) => s.fit !== "none").length === 0 ? (
                  <p className="text-sm text-pine/70">
                    No weekend works for that exact crew yet — nudge them to fill
                    it in, or loosen the group.
                  </p>
                ) : (
                  stats
                    .filter((s) => s.fit !== "none")
                    .map((s) => {
                      const f = formatWeekend(s.w);
                      return (
                        <div
                          key={s.w.id}
                          className={`rounded-2xl border px-5 py-4 ${
                            s.fit === "clear"
                              ? "border-forest/40 bg-forest/10"
                              : "border-clay/40 bg-clay/10"
                          }`}
                        >
                          <p className="font-display text-xl text-forest">
                            {f.range}{" "}
                            <span className="font-sans text-sm text-pine/70">
                              {f.month}
                            </span>
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-clay">
                            {s.fit === "clear"
                              ? "Everyone's a yes"
                              : "Works if the maybes come"}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </>
        )}

        {isOrganizer && (
          <div className="mt-12 border-t border-clay/20 pt-6">
            <button
              type="button"
              onClick={onDeleteGroup}
              className="text-sm text-clay underline underline-offset-2 transition hover:text-[#b5552f]"
            >
              Delete this group
            </button>
          </div>
        )}

        {!GROUPS_API && (
          <p className="mt-6 text-sm text-[#b5552f]">
            Sharing backend isn&apos;t configured — responses won&apos;t be
            saved.
          </p>
        )}
      </section>
    </>
  );
}
