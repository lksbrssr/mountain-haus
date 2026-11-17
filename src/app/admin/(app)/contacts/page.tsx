import { tradespeople, neighbours, foodTips } from "@/lib/admin/contacts";

export default function ContactsPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Contacts</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Tradespeople, suppliers and neighbours from the handover — plus the
          local food & drink tips.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl text-forest">Tradespeople & suppliers</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tradespeople.map((c) => (
            <div key={c.name} className="rounded-2xl border border-clay/30 bg-cream p-5">
              <div className="text-xs uppercase tracking-wide text-pine/60">{c.trade}</div>
              <div className="mt-1 font-display text-lg text-forest">{c.name}</div>
              {c.location && <div className="mt-1 text-sm text-pine/70">{c.location}</div>}
              {c.phone && <div className="mt-2 text-sm font-medium text-lake">{c.phone}</div>}
              {c.note && <p className="mt-2 text-sm text-pine/75">{c.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-forest">Neighbours & local</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {neighbours.map((c) => (
            <div key={c.name} className="rounded-2xl border border-clay/30 bg-cream p-5">
              <div className="text-xs uppercase tracking-wide text-pine/60">{c.trade}</div>
              <div className="mt-1 font-display text-lg text-forest">{c.name}</div>
              {c.phone && <div className="mt-2 text-sm font-medium text-lake">{c.phone}</div>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-forest">Food & drink</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foodTips.map((f) => (
            <div key={f.name} className="rounded-2xl border border-clay/30 bg-cream p-5">
              <div className="text-xs uppercase tracking-wide text-pine/60">{f.kind}</div>
              <div className="mt-1 font-display text-lg text-forest">{f.name}</div>
              {f.location && <div className="mt-1 text-sm text-pine/70">{f.location}</div>}
              {f.phone && <div className="mt-2 text-sm font-medium text-lake">{f.phone}</div>}
              {f.note && <p className="mt-2 text-sm text-pine/75">{f.note}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
