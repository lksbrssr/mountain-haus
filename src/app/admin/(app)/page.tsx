import Link from "next/link";
import { property, meters, keys } from "@/lib/admin/meta";
import { tasks, categoryEmoji } from "@/lib/admin/tasks";
import { setupTasks } from "@/lib/admin/setup";

const sections = [
  { href: "/admin/calendar", title: "Jahreskalender", emoji: "🗓️", desc: "Wartung & Fristen übers Jahr" },
  { href: "/admin/setup", title: "Einrichten", emoji: "✅", desc: "An-/Ummeldungen nach dem Kauf" },
  { href: "/admin/systems", title: "Systeme", emoji: "⚙️", desc: "Schließanlage, Heizung, Gastank, Wasser" },
  { href: "/admin/appliances", title: "Geräte", emoji: "🔌", desc: "Spülmaschine, Staubsauger, Rasenmäher" },
  { href: "/admin/contacts", title: "Kontakte", emoji: "📇", desc: "Handwerker, Lieferanten, Essen & Trinken" },
  { href: "/admin/documents", title: "Dokumente", emoji: "📂", desc: "Alle Belege & Nachweise als PDF" },
];

// Tasks with a concrete next date/year, nearest first.
const upcoming = tasks
  .filter((t) => t.nextDue)
  .sort((a, b) => (a.nextDue! > b.nextDue! ? 1 : -1))
  .slice(0, 6);

export default function AdminOverview() {
  const openSetup = setupTasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Hausverwaltung</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Alles rund um {property.address} an einem Ort — digitalisiert aus den
          Übergabe-Unterlagen. Was wann zu tun ist, wen man anruft, und wo die
          Belege liegen.
        </p>
      </header>

      {/* Quick facts */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Objekt" value={property.type} sub={`FlNr. ${property.flurnummer}`} />
        <Fact label="Übergabe" value={new Date(property.handoverDate).toLocaleDateString("de-DE")} sub={`von ${property.sellers}`} />
        <Fact label="Offene Anmeldungen" value={`${openSetup}`} sub="nach dem Kauf" accent />
        <Fact label="Wartungsaufgaben" value={`${tasks.length}`} sub="im Jahreskalender" />
      </section>

      {/* Section tiles */}
      <section>
        <h2 className="font-display text-2xl text-forest">Bereiche</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-2xl border border-clay/30 bg-cream p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-forest/40"
            >
              <div className="text-2xl">{s.emoji}</div>
              <div className="mt-3 font-display text-lg text-forest">{s.title}</div>
              <div className="mt-1 text-sm text-pine/80">{s.desc}</div>
              <div className="mt-3 text-sm text-lake opacity-0 transition group-hover:opacity-100">
                Öffnen →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Next up */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-forest">Nächste Termine</h2>
            <Link href="/admin/calendar" className="text-sm text-lake hover:underline">
              Kalender →
            </Link>
          </div>
          <ul className="mt-5 space-y-3">
            {upcoming.map((t) => (
              <li
                key={t.id}
                className="flex items-start gap-3 rounded-xl border border-clay/25 bg-cream px-4 py-3"
              >
                <span className="text-lg">{categoryEmoji[t.category]}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-forest">{t.title}</div>
                  {t.who && <div className="text-xs text-pine/70">{t.who}</div>}
                </div>
                <span className="whitespace-nowrap rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-pine">
                  {t.nextDue}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Meters & keys */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl text-forest">Zählerstände (Übergabe)</h2>
            <ul className="mt-5 space-y-3">
              {meters.map((m) => (
                <li key={m.kind} className="rounded-xl border border-clay/25 bg-cream px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-forest">{m.kind}</span>
                    <span className="font-display text-lg text-forest">{m.reading}</span>
                  </div>
                  <div className="mt-1 text-xs text-pine/70">Zähler-Nr. {m.meterNo}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-forest">Schlüssel übergeben</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {keys.map((k) => (
                <li
                  key={k.what}
                  className="rounded-full border border-clay/30 bg-cream px-3 py-1.5 text-sm text-pine"
                >
                  <strong className="text-forest">{k.count}×</strong> {k.what}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-lake/40 bg-lake/10" : "border-clay/30 bg-cream"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-pine/70">{label}</div>
      <div className="mt-2 font-display text-2xl text-forest">{value}</div>
      {sub && <div className="mt-1 text-xs text-pine/70">{sub}</div>}
    </div>
  );
}
