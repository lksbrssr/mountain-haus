"use client";

import { useState } from "react";

export function UnlockForm({ from, hasError }: { from?: string; hasError: boolean }) {
  const [error, setError] = useState(hasError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, from }),
    });
    if (res.ok) {
      const { redirect } = await res.json();
      window.location.href = redirect || "/";
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7">
      <label className="block text-sm font-medium text-forest">Password</label>
      <input
        name="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-forest outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/30 ${
          error ? "border-red-400" : "border-clay/40"
        }`}
        placeholder="••••••••"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">That's not it. Try again?</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-forest py-3 font-medium text-cream transition hover:bg-pine disabled:opacity-60"
      >
        {loading ? "Unlocking…" : "Unlock the house"}
      </button>
    </form>
  );
}
