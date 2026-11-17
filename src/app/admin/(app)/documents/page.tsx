import Link from "next/link";
import { documents } from "@/lib/admin/documents";

const categories = Array.from(new Set(documents.map((d) => d.category)));

export default function DocumentsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Documents</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          The original combined scan, split into logical single PDFs. Each opens
          in a new tab.
        </p>
      </header>

      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="font-display text-2xl text-forest">{cat}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents
              .filter((d) => d.category === cat)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={d.file}
                  target="_blank"
                  className="group flex flex-col rounded-2xl border border-clay/30 bg-cream p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-forest/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{d.emoji}</span>
                    <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs text-pine">
                      {d.pages} {d.pages === 1 ? "page" : "pages"}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-lg text-forest">{d.title}</div>
                  <p className="mt-1 flex-1 text-sm text-pine/80">{d.summary}</p>
                  <div className="mt-3 text-sm text-lake opacity-0 transition group-hover:opacity-100">
                    Open PDF →
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
