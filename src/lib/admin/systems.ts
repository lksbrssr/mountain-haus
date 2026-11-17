// House systems, specs and how-tos for Reitberg 16. Owner reference.

export type Spec = { label: string; value: string };

export type HouseSystem = {
  id: string;
  name: string;
  emoji: string;
  summary: string;
  specs: Spec[];
  howto?: string[];
  docSlug?: string; // links to a document in documents.ts
};

export const systems: HouseSystem[] = [
  {
    id: "locks",
    name: "Schließanlage & Schlüssel",
    emoji: "🔑",
    summary:
      "Eine ABUS-Schließanlage ist verbaut — alle Schlösser öffnen mit dem gleichen Schlüssel. Die Sicherungskarte (ID-Karte) liegt den Unterlagen bei und wird für den Nachkauf von Schlüsseln gebraucht.",
    specs: [
      { label: "System", value: "ABUS Wavy Line 6K (WL410/WL452)" },
      { label: "Sicherungskarte", value: "SWL 64233" },
      { label: "Schlüsselanzahl", value: "15 (10 beim Hauseingang übergeben)" },
      { label: "Fachhändler", value: "Sicherheitstechnik Feldmann, München · 089 20232216" },
    ],
    howto: [
      "Zusätzliche Schlüssel nur mit Sicherungskarte beim Fachhändler bestellen.",
      "Sicherungskarte sicher verwahren — ohne sie kein Nachschlüssel.",
    ],
    docSlug: "schliessanlage",
  },
  {
    id: "heating",
    name: "Heizung",
    emoji: "🔥",
    summary:
      "Heizkessel Brötje WGO 25 von 1997, betrieben mit Flüssiggas aus dem Erdtank. Jährliche Wartung über Fa. Auracher.",
    specs: [
      { label: "Kessel", value: "Brötje WGO 25, Nr. 431297" },
      { label: "Baujahr", value: "1997" },
      { label: "Brennstoff", value: "Flüssiggas (Propan/Butan) aus Erdtank" },
      { label: "Wartung", value: "Fa. Auracher Haustechnik, Fischbachau" },
    ],
    howto: [
      "Wartung jährlich vor der Heizsaison (Herbst).",
      "Schornsteinfeger macht Abgasmessung / Feuerstättenschau.",
    ],
  },
  {
    id: "gastank",
    name: "Flüssiggastank",
    emoji: "⛽",
    summary:
      "Erdgelagerter Flüssiggastank (6.400 L), Eigentum — kein Mietvertrag, freie Lieferantenwahl. Zwei gesetzliche Prüfungen: Äußere Prüfung alle 2 Jahre, Innere Prüfung alle 10 Jahre.",
    specs: [
      { label: "Größe", value: "6.400 L (2,9 t) · max. Füllung 80 % ≈ 5.120 L" },
      { label: "Hersteller / Baujahr", value: "Ermert · 1997 · unterirdisch" },
      { label: "Behälter-Nr.", value: "738793 / 738795" },
      { label: "Äußere Prüfung", value: "alle 2 J · zuletzt 28.05.2024 · nächste 2026" },
      { label: "Innere Prüfung", value: "alle 10 J · zuletzt 16.06.2020 · nächste 06/2030" },
      { label: "Eigentumsnachweis", value: "SANO-Propan Rechnung 1997" },
    ],
    howto: [
      "Füllstand vor dem Winter prüfen und rechtzeitig nachbestellen (Gloria-Gas / H+H).",
      "Beide Prüfungen über den Gaslieferanten anmelden — Fristen nicht verpassen.",
    ],
    docSlug: "fluessiggas",
  },
  {
    id: "smoke",
    name: "Rauchwarnmelder",
    emoji: "🔔",
    summary:
      "Ei Electronics Ei650 mit 10-Jahres-Batterie, Magnetbefestigung. Jährlich testen, 2027 kompletter Satz-Tausch fällig.",
    specs: [
      { label: "Modell", value: "Ei Electronics Ei650 (5 Stück)" },
      { label: "Verbaut", value: "12/2017 (Fa. Özkan)" },
      { label: "Batterie", value: "10 Jahre fest — Satz-Ende 2027" },
    ],
    howto: [
      "1× jährlich per Prüftaste testen.",
      "Bei Fehlfunktion Melder tauschen — Magnethalterung, werkzeuglos.",
    ],
    docSlug: "rauchwarnmelder",
  },
  {
    id: "water",
    name: "Wasser & Filter",
    emoji: "💧",
    summary:
      "Sehr kalkhaltiges Wasser. Perlatoren mit Zitronensäure (nie Essig) entkalken. Legionellenfilter im Duschkopf (Elternbad) und Kalkfilter am Dusch-WC bei nachlassendem Durchfluss tauschen.",
    specs: [
      { label: "Duschkopf-Filter", value: "SAFETY CHROM mit Legionellenfilter (Elternbad 1. OG)" },
      { label: "Ersatzfilter", value: "Amazon / eBay (~69 €)" },
      { label: "Dusch-WC", value: "Kalkfilter — Ersatz im Haus vorhanden" },
    ],
    howto: [
      "Perlatoren: Zitronensäure, nie Essig.",
      "Filter tauschen, sobald der Strahl spürbar nachlässt.",
    ],
    docSlug: "legionellenfilter",
  },
  {
    id: "doorbell",
    name: "Haustürklingel",
    emoji: "🔕",
    summary:
      "Die Original-Klingel wurde durch Blitzschlag zerstört. Jetzt ist eine Funkklingel installiert, die etwa alle 6 Monate neue Batterien braucht.",
    specs: [{ label: "Typ", value: "Funkklingel (batteriebetrieben)" }],
    howto: ["Batterien ca. halbjährlich wechseln."],
  },
];
