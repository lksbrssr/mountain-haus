import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl text-forest">404</p>
      <p className="mt-4 text-pine">We couldn't find that room.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-forest px-6 py-3 font-medium text-cream transition hover:bg-pine"
      >
        Back home
      </Link>
    </main>
  );
}
