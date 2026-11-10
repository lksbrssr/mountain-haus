"use client";

import { useState } from "react";
import Image from "next/image";
import { house } from "@/lib/house";
import type { ShopItem } from "@/lib/shopping";

function formatEuro(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function ShoppingClient({ items }: { items: ShopItem[] }) {
  const [showPrices, setShowPrices] = useState(true);

  const known = items.filter((i) => i.price != null);
  const total = known.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const boughtCount = items.filter((i) => i.status === "bought").length;

  return (
    <>
      {/* Hero strip */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-clay">
          The Haus · Furnishing list
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-5xl leading-[1.05] text-forest sm:text-6xl">
          Things for the haus
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-pine/90">
          A running list of what we&apos;re planning to buy — and what&apos;s already
          on its way. Prices are a snapshot; tap any item to see it at the source.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine">
            {items.length} items
          </span>
          <span className="rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine">
            {boughtCount} bought · {items.length - boughtCount} planned
          </span>
          {showPrices && (
            <span className="rounded-full bg-forest px-4 py-2 font-medium text-cream">
              {formatEuro(total)} total
            </span>
          )}

          {/* Price toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={showPrices}
            onClick={() => setShowPrices((v) => !v)}
            className="ml-auto flex items-center gap-2.5 rounded-full border border-clay/30 bg-cream px-4 py-2 text-pine transition hover:border-forest/40"
          >
            <span>Show prices</span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${
                showPrices ? "bg-forest" : "bg-clay/40"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream transition ${
                  showPrices ? "left-[1.125rem]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>
      </section>

      {/* Product grid */}
      <section className="bg-sand/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <a
                key={item.name}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-3xl border border-clay/25 bg-cream transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
                    className="object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${
                      item.status === "bought"
                        ? "bg-lake text-cream"
                        : "bg-cream/90 text-forest ring-1 ring-clay/30"
                    }`}
                  >
                    {item.status === "bought" ? "Bought" : "Planned"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-clay">
                    {item.category}
                  </p>
                  <h3 className="mt-1 font-display text-xl leading-snug text-forest">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-pine/80">{item.brand}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-pine/90">
                    {item.blurb}
                  </p>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      {showPrices ? (
                        item.price != null ? (
                          <p className="font-display text-2xl text-forest">
                            {formatEuro(item.price)}
                            {item.priceNote ? (
                              <span className="ml-1 font-sans text-sm text-pine/70">
                                {item.priceNote}
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="font-display text-lg text-pine/60">TBD</p>
                        )
                      ) : (
                        <p className="font-display text-lg text-pine/40">—</p>
                      )}
                      <p className="mt-0.5 text-xs text-clay">{item.source}</p>
                    </div>
                    <span className="rounded-full border border-forest/30 px-4 py-2 text-sm text-forest transition group-hover:bg-forest group-hover:text-cream">
                      View →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-pine/70">
            Prices shown are the latest we saw and may have changed. Nothing here is
            a checkout — just our wish list for {house.name}.
          </p>
        </div>
      </section>
    </>
  );
}
