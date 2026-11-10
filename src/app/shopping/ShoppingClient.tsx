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

type Vote = "up" | "down" | null;
type UiStatus = "planned" | "bought" | "skip";

const STATUS_LABEL: Record<UiStatus, string> = {
  planned: "Planned",
  bought: "Bought",
  skip: "Not planned",
};
const NEXT_STATUS: Record<UiStatus, UiStatus> = {
  planned: "bought",
  bought: "skip",
  skip: "planned",
};

export function ShoppingClient({ items }: { items: ShopItem[] }) {
  const [showPrices, setShowPrices] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [statuses, setStatuses] = useState<Record<string, UiStatus>>(() =>
    Object.fromEntries(items.map((i) => [i.name, i.status])),
  );

  function cycleStatus(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    setStatuses((prev) => {
      const current = prev[name] ?? "planned";
      return { ...prev, [name]: NEXT_STATUS[current] };
    });
  }

  function castVote(
    e: React.MouseEvent,
    name: string,
    dir: "up" | "down",
  ) {
    // Keep the surrounding <a> from navigating to the source.
    e.preventDefault();
    e.stopPropagation();
    setVotes((prev) => ({ ...prev, [name]: prev[name] === dir ? null : dir }));
  }

  const statusOf = (name: string): UiStatus => statuses[name] ?? "planned";
  const known = items.filter((i) => i.price != null);
  const total = known.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const boughtCount = items.filter((i) => statusOf(i.name) === "bought").length;
  const skipCount = items.filter((i) => statusOf(i.name) === "skip").length;
  const plannedCount = items.length - boughtCount - skipCount;

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
            {boughtCount} bought · {plannedCount} planned
            {skipCount > 0 ? ` · ${skipCount} skipped` : ""}
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
                {/* Wrapper is NOT clipped, so the vote pill can hang below the image */}
                <div className="relative">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
                      className="object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
                    />
                    <button
                      type="button"
                      onClick={(e) => cycleStatus(e, item.name)}
                      title="Tap to change status"
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium transition hover:scale-105 ${
                        statusOf(item.name) === "bought"
                          ? "bg-lake text-cream"
                          : statusOf(item.name) === "skip"
                            ? "bg-ink/70 text-cream"
                            : "bg-cream/90 text-forest ring-1 ring-clay/30"
                      }`}
                    >
                      {STATUS_LABEL[statusOf(item.name)]}
                    </button>
                  </div>

                  {/* Vote pill — sits at the image's bottom-right, 35% of its
                      height protruding below the image edge. */}
                  <div className="absolute bottom-0 right-4 flex translate-y-[35%] items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Thumbs up"
                      aria-pressed={votes[item.name] === "up"}
                      onClick={(e) => castVote(e, item.name, "up")}
                      className={`flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-full border border-clay/20 text-[0.95rem] leading-none shadow-soft transition hover:scale-110 ${
                        votes[item.name] === "up" ? "bg-lake/20" : "bg-cream opacity-80 hover:opacity-100"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      aria-label="Thumbs down"
                      aria-pressed={votes[item.name] === "down"}
                      onClick={(e) => castVote(e, item.name, "down")}
                      className={`flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-full border border-clay/20 text-[0.95rem] leading-none shadow-soft transition hover:scale-110 ${
                        votes[item.name] === "down" ? "bg-clay/25" : "bg-cream opacity-80 hover:opacity-100"
                      }`}
                    >
                      👎
                    </button>
                  </div>
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
