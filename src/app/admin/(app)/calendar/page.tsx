import {
  tasks,
  monthsDE,
  cadenceLabel,
  categoryEmoji,
  type MaintenanceTask,
  type Cadence,
} from "@/lib/admin/tasks";

const monthTasks = (m: number) => tasks.filter((t) => t.month === m);
const seasonalTasks = tasks.filter((t) => t.cadence === "seasonal");
const asNeededTasks = tasks.filter((t) => t.cadence === "asNeeded");
const datedTasks = tasks
  .filter((t) => t.nextDue)
  .sort((a, b) => (a.nextDue! > b.nextDue! ? 1 : -1));

const cadenceTone: Record<Cadence, string> = {
  annual: "bg-lake/15 text-lake",
  biennial: "bg-forest/10 text-pine",
  decennial: "bg-forest/10 text-pine",
  semiannual: "bg-clay/25 text-ink/70",
  seasonal: "bg-clay/25 text-ink/70",
  asNeeded: "bg-sand text-ink/60",
  oneOff: "bg-lake/15 text-lake",
};

export default function CalendarPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Jahreskalender</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Wiederkehrende Wartung, Prüfungen und Fristen über das Jahr verteilt.
          Fixe Monatsaufgaben im Raster, saisonale und terminlose Aufgaben
          darunter.
        </p>
      </header>

      {/* Dated deadlines strip */}
      <section>
        <h2 className="font-display text-2xl text-forest">Feste Fristen</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {datedTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl border border-lake/30 bg-lake/5 px-3 py-2"
            >
              <span className="text-lg">{categoryEmoji[t.category]}</span>
              <div>
                <div className="text-sm font-medium text-forest">{t.title}</div>
                <div className="text-xs text-pine/70">
                  fällig <strong className="text-lake">{t.nextDue}</strong>
                  {t.lastDone ? ` · zuletzt ${t.lastDone}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12-month grid */}
      <section>
        <h2 className="font-display text-2xl text-forest">Übers Jahr</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monthsDE.map((label, i) => {
            const m = i + 1;
            const items = monthTasks(m);
            return (
              <div
                key={m}
                className={`rounded-2xl border p-4 ${
                  items.length
                    ? "border-clay/30 bg-cream"
                    : "border-clay/20 bg-cream/50"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg text-forest">{label}</span>
                  <span className="text-xs text-pine/50">{String(m).padStart(2, "0")}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {items.length ? (
                    items.map((t) => <TaskRow key={t.id} t={t} />)
                  ) : (
                    <li className="text-sm text-pine/40">—</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seasonal */}
      <section>
        <h2 className="font-display text-2xl text-forest">Saisonal</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {seasonalTasks.map((t) => (
            <div key={t.id} className="rounded-xl border border-clay/25 bg-cream p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryEmoji[t.category]}</span>
                <span className="font-medium text-forest">{t.title}</span>
                <span className="ml-auto rounded-full bg-clay/25 px-2.5 py-0.5 text-xs text-ink/70">
                  {t.season}
                </span>
              </div>
              <p className="mt-2 text-sm text-pine/80">{t.detail}</p>
              {t.who && <p className="mt-1 text-xs text-pine/60">→ {t.who}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* As needed */}
      <section>
        <h2 className="font-display text-2xl text-forest">Bei Bedarf</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {asNeededTasks.map((t) => (
            <div key={t.id} className="rounded-xl border border-clay/25 bg-cream p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryEmoji[t.category]}</span>
                <span className="font-medium text-forest">{t.title}</span>
              </div>
              <p className="mt-2 text-sm text-pine/80">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legend */}
      <section className="rounded-2xl border border-clay/25 bg-cream/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-pine/70">
          Rhythmus
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(cadenceLabel) as Cadence[]).map((c) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1 text-xs font-medium ${cadenceTone[c]}`}
            >
              {cadenceLabel[c]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function TaskRow({ t }: { t: MaintenanceTask }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-base">{categoryEmoji[t.category]}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-forest">{t.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cadenceTone[t.cadence]}`}>
            {cadenceLabel[t.cadence]}
          </span>
          {t.who && <span className="text-[11px] text-pine/60">{t.who}</span>}
        </div>
      </div>
    </li>
  );
}
