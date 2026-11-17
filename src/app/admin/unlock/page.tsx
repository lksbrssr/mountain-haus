import Image from "next/image";
import { house } from "@/lib/house";
import { AdminUnlockForm } from "./AdminUnlockForm";

export default function AdminUnlockPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Image src={house.heroImage} alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-cream/95 p-8 shadow-soft sm:p-10">
        <p className="font-sans text-xs uppercase tracking-[0.28em] text-clay">
          {house.location} · Admin
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-forest">
          House admin
        </h1>
        <p className="mt-3 leading-relaxed text-pine/90">
          Private admin area. Please enter the admin password.
        </p>

        <AdminUnlockForm from={searchParams.from} hasError={!!searchParams.error} />
      </div>
    </main>
  );
}
