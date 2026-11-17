import Link from "next/link";
import { systems } from "@/lib/admin/systems";
import { documents } from "@/lib/admin/documents";

const docFor = (slug?: string) =>
  slug ? documents.find((d) => d.slug === slug) : undefined;

export default function SystemsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Systeme</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Haustechnik auf einen Blick — Schließanlage, Heizung, Flüssiggastank,
          Rauchmelder, Wasser/Filter und Klingel. Mit Daten, Kurz-Anleitungen und
          Link zum Beleg.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {systems.map((s) => {
          const doc = docFor(s.docSlug);
          return (
            <article
              key={s.id}
              className="flex flex-col rounded-2xl border border-clay/30 bg-cream p-6 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <h2 className="font-display text-xl text-forest">{s.name}</h2>
              </div>
              <p className="mt-3 text-sm text-pine/85">{s.summary}</p>

              <dl className="mt-4 divide-y divide-clay/20 rounded-xl border border-clay/20 bg-sand/30 text-sm">
                {s.specs.map((sp) => (
                  <div key={sp.label} className="flex gap-3 px-4 py-2">
                    <dt className="w-2/5 flex-none text-pine/70">{sp.label}</dt>
                    <dd className="font-medium text-forest">{sp.value}</dd>
                  </div>
                ))}
              </dl>

              {s.howto && (
                <ul className="mt-4 space-y-1.5 text-sm text-pine/85">
                  {s.howto.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-lake">›</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              {doc && (
                <Link
                  href={doc.file}
                  target="_blank"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-forest/10 px-4 py-2 text-sm text-pine transition hover:bg-forest/15"
                >
                  📄 Beleg öffnen ({doc.pages} S.)
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
