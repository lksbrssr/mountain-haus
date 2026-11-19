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
  MAX_WEEKENDS,
  upcomingWeekends,
  type WeekendOption,
} from "@/lib/weekends";

const NAME_KEY = "haus-group-name";

export function GroupsIndexClient() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const options = useMemo(() => upcomingWeekends(14), []);
  const byId = useMemo(() => {
    const m = new Map<string, WeekendOption>();
    for (const w of options) m.set(w.id, w);
    return m;
  }, [options]);

  useEffect(() => {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) setName(n);
    } catch {
      /* ignore */
    }
    if (!GROUPS_API) {
      setGroups([]);
      return;
    }
    listGroups()
      .then(setGroups)
      .catch(() => setLoadError("Couldn't load existing groups."));
  }, []);

  function togglePick(id: string) {
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_WEEKENDS
          ? prev
          : [...prev, id],
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const organizer = name.trim();
    const t = title.trim();
    if (!organizer) return setCreateError("Add your name first.");
    if (!t) return setCreateError("Give your group a name.");
    if (picked.length === 0)
      return setCreateError("Pick at least one weekend.");
    try {
      localStorage.setItem(NAME_KEY, organizer);
    } catch {
      /* ignore */
    }
    const weekends = picked
      .map((id) => byId.get(id))
      .filter((w): w is WeekendOption => Boolean(w))
      .sort((a, b) => a.start.localeCompare(b.start));
    setCreating(true);
    try {
      const group = await createGroup({ title: t, organizer, weekends });
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setCreateError((err as Error).message);
      setCreating(false);
    }
  }

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
                  <span className="text-clay">(pick up to {MAX_WEEKENDS})</span>
                </span>
                <span className="text-xs text-clay">
                  {picked.length}/{MAX_WEEKENDS}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {options.map((w) => {
                  const on = picked.includes(w.id);
                  const full = !on && picked.length >= MAX_WEEKENDS;
                  const f = formatWeekend(w);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => togglePick(w.id)}
                      disabled={full}
                      className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                        on
                          ? "border-forest bg-forest text-cream"
                          : full
                            ? "cursor-not-allowed border-clay/20 bg-white/50 text-pine/40"
                            : "border-clay/30 bg-white text-forest hover:border-forest/40"
                      }`}
                    >
                      <span className="block text-[0.7rem] uppercase tracking-wide opacity-70">
                        {f.weekday}
                      </span>
                      <span className="block font-display text-lg leading-tight">
                        {f.range}
                      </span>
                      <span className="block text-xs opacity-70">{f.month}</span>
                    </button>
                  );
                })}
              </div>
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
