import { SetupClient } from "./SetupClient";

export default function SetupPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl text-forest sm:text-5xl">Einrichten</h1>
        <p className="mt-3 max-w-2xl text-pine/90">
          Die einmaligen An- und Ummeldungen nach dem Kauf — Strom, Wasser, Müll,
          Schornsteinfeger, Flüssiggas, Versicherung, Grundsteuer und mehr.
          Abhaken, sobald erledigt.
        </p>
      </header>
      <SetupClient />
    </div>
  );
}
