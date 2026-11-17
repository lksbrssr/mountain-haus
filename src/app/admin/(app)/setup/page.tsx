import { SetupClient } from "./SetupClient";

export default function SetupPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Set up</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          The one-off registrations after the purchase — electricity, water,
          refuse, chimney sweep, LPG, insurance, property tax and more. Tick
          them off as you go.
        </p>
      </header>
      <SetupClient />
    </div>
  );
}
