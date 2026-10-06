import Link from "next/link";
import { getReservations } from "@/lib/reservations";
import { prettyRange } from "@/lib/format";
import { house } from "@/lib/house";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function WhosComing() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (await getReservations())
    .filter((r) => r.checkOut >= today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <main className="relative min-h-screen bg-sand/40">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-28">
        <Link href="/" className="text-sm text-pine transition hover:text-forest">
          ← Home
        </Link>
        <h1 className="mt-4 font-display text-4xl text-forest sm:text-5xl">Who&apos;s coming</h1>
        <p className="mt-3 max-w-lg text-pine/90">
          {house.name} is a shared house — here&apos;s who else will be around. Pick dates that
          suit you, or come when friends are in.
        </p>

        {upcoming.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-clay/30 bg-cream p-10 text-center">
            <div className="text-4xl">🏔️</div>
            <p className="mt-4 font-display text-2xl text-forest">No stays booked yet</p>
            <p className="mt-2 text-pine/80">
              Looks like you&apos;d have the whole place to yourselves.{" "}
              <Link href="/#rooms" className="text-lake underline">
                Request a stay →
              </Link>
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {upcoming.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-4 rounded-2xl border border-clay/30 bg-cream p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 font-display text-lg text-forest">
                    {r.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-forest">
                      {r.name}
                      {r.guests > 1 ? ` + ${r.guests - 1}` : ""}
                    </p>
                    <p className="text-sm text-clay">{r.room}</p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-sm text-pine/90">
                  {prettyRange(r.checkIn, r.checkOut)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs text-pine/50">
          Only first names and rooms are shown here. Contact details stay private.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
