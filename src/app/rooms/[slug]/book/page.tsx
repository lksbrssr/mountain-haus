import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom, rooms } from "@/lib/rooms";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { CheckoutForm } from "./CheckoutForm";

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export default function BookPage({ params }: { params: { slug: string } }) {
  const room = getRoom(params.slug);
  if (!room) notFound();

  return (
    <main className="relative min-h-screen bg-sand/40">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-28">
        <Link
          href={`/rooms/${room.slug}`}
          className="text-sm text-pine transition hover:text-forest"
        >
          ← Back to {room.name}
        </Link>
        <h1 className="mt-4 font-display text-4xl text-forest sm:text-5xl">
          Request your stay
        </h1>
        <p className="mt-3 max-w-lg text-pine/90">
          A quick checkout — except there's nothing to pay. Tell us who's coming
          and when, and we'll confirm by email.
        </p>

        <CheckoutForm
          slug={room.slug}
          roomName={room.name}
          sleeps={room.sleeps}
          image={room.images[0]}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
