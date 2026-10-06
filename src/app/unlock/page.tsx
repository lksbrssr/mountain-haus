import Image from "next/image";
import { house } from "@/lib/house";
import { UnlockForm } from "./UnlockForm";

export default function UnlockPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Image
        src={house.heroImage}
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />

      <div className="rise relative z-10 w-full max-w-md rounded-3xl bg-cream/95 p-8 shadow-soft sm:p-10">
        <p className="font-sans text-xs uppercase tracking-[0.28em] text-clay">
          {house.location}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-forest">
          {house.name}
        </h1>
        <p className="mt-3 leading-relaxed text-pine/90">
          This little place is private. Pop in the password we sent you and come on in.
        </p>

        <UnlockForm from={searchParams.from} hasError={!!searchParams.error} />

        <p className="mt-6 text-center text-xs text-pine/60">
          No password? Email {house.email}.
        </p>
      </div>
    </main>
  );
}
