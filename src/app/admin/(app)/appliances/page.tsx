import Link from "next/link";
import { appliances } from "@/lib/admin/appliances";
import { documents } from "@/lib/admin/documents";

export default function AppliancesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Geräte</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Geräte, die mit dem Haus kamen oder dafür gekauft wurden — mit Kaufdatum,
          Preis, Garantie und Beleg.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {appliances.map((a) => {
          const doc = a.docSlug ? documents.find((d) => d.slug === a.docSlug) : undefined;
          return (
            <article
              key={a.name}
              className="flex flex-col rounded-2xl border border-clay/30 bg-cream p-5 shadow-soft"
            >
              <div className="text-2xl">{a.emoji}</div>
              <h2 className="mt-3 font-display text-lg text-forest">{a.name}</h2>
              <p className="mt-1 text-sm text-pine/80">{a.brand}</p>

              <dl className="mt-4 space-y-1.5 text-sm">
                {a.bought && <Row label="Gekauft" value={a.bought} />}
                {a.price && <Row label="Preis" value={a.price} />}
                {a.warranty && <Row label="Garantie" value={a.warranty} />}
                {a.location && <Row label="Ort" value={a.location} />}
              </dl>
              {a.note && <p className="mt-3 text-sm text-pine/75">{a.note}</p>}

              {doc && (
                <Link
                  href={doc.file}
                  target="_blank"
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-forest/10 px-4 py-2 pt-2 text-sm text-pine transition hover:bg-forest/15"
                >
                  📄 Beleg
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 flex-none text-pine/60">{label}</dt>
      <dd className="font-medium text-forest">{value}</dd>
    </div>
  );
}
