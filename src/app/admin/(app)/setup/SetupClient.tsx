"use client";

import { useEffect, useState } from "react";
import {
  setupTasks,
  priorityLabel,
  type SetupPriority,
  type SetupTask,
} from "@/lib/admin/setup";

const order: SetupPriority[] = ["now", "soon", "later"];
const tone: Record<SetupPriority, string> = {
  now: "bg-lake/15 text-lake",
  soon: "bg-forest/10 text-pine",
  later: "bg-sand text-ink/60",
};
const KEY = "hh_setup_done";

export function SetupClient() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isDone = (t: SetupTask) => done[t.id] ?? t.done;
  const total = setupTasks.length;
  const completed = setupTasks.filter((t) => isDone(t)).length;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="rounded-2xl border border-clay/30 bg-cream p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-pine/80">Done</span>
          <span className="font-display text-xl text-forest">
            {completed} / {total}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-lake transition-all"
            style={{ width: ready ? `${(completed / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {order.map((p) => {
        const group = setupTasks.filter((t) => t.priority === p);
        if (!group.length) return null;
        return (
          <section key={p}>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-forest">{priorityLabel[p]}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[p]}`}>
                {group.filter((t) => isDone(t)).length}/{group.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {group.map((t) => {
                const checked = isDone(t);
                return (
                  <li
                    key={t.id}
                    className={`rounded-xl border p-4 transition ${
                      checked
                        ? "border-clay/20 bg-cream/50"
                        : "border-clay/30 bg-cream"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(t.id)}
                        className="mt-1 h-5 w-5 flex-none accent-lake"
                      />
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            checked ? "text-pine/50 line-through" : "text-forest"
                          }`}
                        >
                          {t.title}
                        </div>
                        <p className="mt-1 text-sm text-pine/80">{t.detail}</p>
                        <p className="mt-2 text-xs text-pine/60">→ {t.where}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-pine/50">
        Checkboxes are saved locally in this browser. Not legal advice — confirm
        details with the Gemeinde / your notary.
      </p>
    </div>
  );
}
