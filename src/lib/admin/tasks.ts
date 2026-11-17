// Recurring maintenance & compliance tasks for Reitberg 16.
// This powers the yearly calendar. Edit cadence / dates / contacts as you go.

export type Cadence =
  | "annual"
  | "biennial"
  | "decennial"
  | "semiannual"
  | "seasonal"
  | "asNeeded"
  | "oneOff";

export type TaskCategory =
  | "Safety"
  | "Heating & gas"
  | "Water"
  | "Garden & outdoor"
  | "Appliances"
  | "Admin";

export type MaintenanceTask = {
  id: string;
  title: string;
  category: TaskCategory;
  cadence: Cadence;
  // 1–12 for tasks tied to a month (used by the calendar grid). Omit for
  // as-needed / seasonal-range tasks.
  month?: number;
  // Free-text season label for seasonal tasks shown on the calendar.
  season?: string;
  lastDone?: string; // ISO date or year
  nextDue?: string; // ISO date or year
  who?: string; // contact label (see contacts.ts)
  detail: string;
};

export const tasks: MaintenanceTask[] = [
  // ——— Safety ———
  {
    id: "smoke-test",
    title: "Rauchwarnmelder testen",
    category: "Safety",
    cadence: "annual",
    month: 10,
    who: "Selbst",
    detail:
      "Alle Melder einmal im Jahr per Prüftaste testen. Es sind Ei Electronics Ei650 mit 10-Jahres-Batterie. Bei Fehlfunktion Melder komplett tauschen — Magnethalterung, geht ohne Werkzeug.",
  },
  {
    id: "smoke-replace",
    title: "Rauchwarnmelder ersetzen (10-Jahres-Ende)",
    category: "Safety",
    cadence: "oneOff",
    nextDue: "2027",
    who: "Selbst / eBay totumlu",
    detail:
      "Die Melder wurden 12/2017 verbaut (Fa. Özkan), 10-Jahres-Batterie läuft 2027 aus. Satz à 5 Stück Ei650 neu setzen.",
  },
  {
    id: "doorbell-batteries",
    title: "Funkklingel-Batterien wechseln",
    category: "Safety",
    cadence: "semiannual",
    who: "Selbst",
    detail:
      "Die Original-Haustürklingel wurde durch Blitzschlag zerstört; es ist eine Funkklingel installiert. Braucht etwa alle 6 Monate neue Batterien.",
  },

  // ——— Heating & gas ———
  {
    id: "boiler-service",
    title: "Heizung warten (Brötje WGO 25, Bj. 1997)",
    category: "Heating & gas",
    cadence: "annual",
    month: 9,
    who: "Fa. Auracher Haustechnik",
    detail:
      "Jährliche Wartung der Heizungsanlage (Brötje WGO 25, Nr. 431297) vor der Heizsaison. Hr. Auracher 0174 7474754 oder Hr. Stöger 0175 4675551.",
  },
  {
    id: "gas-ext-inspection",
    title: "Flüssiggastank — Äußere Prüfung (ÄP)",
    category: "Heating & gas",
    cadence: "biennial",
    lastDone: "2024-05-28",
    nextDue: "2026",
    who: "Gaslieferant / Schenk Tanktransport",
    detail:
      "Wiederkehrende äußere Prüfung alle 2 Jahre (Behälter < 3 t). Zuletzt 28.05.2024, nächste 2026. Anmeldung über den Gaslieferanten. Kosten ca. 79 €.",
  },
  {
    id: "gas-int-inspection",
    title: "Flüssiggastank — Innere Prüfung (IP)",
    category: "Heating & gas",
    cadence: "decennial",
    lastDone: "2020-06-16",
    nextDue: "2030-06",
    who: "Gaslieferant / TÜV Austria",
    detail:
      "Innere Prüfung alle 10 Jahre (Druckbehälter). Zuletzt 16.06.2020 (TÜV Austria, ohne Mangel), nächste Frist 06/2030. Anmeldung über den Gaslieferanten.",
  },
  {
    id: "gas-level",
    title: "Gastank-Füllstand prüfen & ggf. nachbestellen",
    category: "Heating & gas",
    cadence: "annual",
    month: 9,
    who: "Gloria-Gas / H+H Flüssiggas",
    detail:
      "Füllstand vor dem Winter ablesen und rechtzeitig nachbestellen. Tank fasst 6.400 L, max. Füllung 80 % ≈ 5.120 L. Stand 19.10.26 war ~4.480 L. Lieferung dauert in der Heizsaison länger.",
  },

  // ——— Water ———
  {
    id: "perlatoren",
    title: "Perlatoren entkalken",
    category: "Water",
    cadence: "asNeeded",
    who: "Selbst",
    detail:
      "Wasser ist sehr kalkhaltig. Perlatoren mit Zitronensäure entkalken — nie mit Essig (greift Dichtungen/Chrom an).",
  },
  {
    id: "legionella-filter",
    title: "Legionellenfilter Duschkopf tauschen",
    category: "Water",
    cadence: "asNeeded",
    who: "Selbst / Amazon",
    detail:
      "Duschkopf SAFETY CHROM im Elternbad (1. OG) hat einen integrierten Legionellenfilter. Wenn der Wasserstrahl nachlässt, Ersatzfilter tauschen (Amazon / eBay, ~69 €).",
  },
  {
    id: "kalkfilter-wc",
    title: "Kalkfilter am Dusch-WC tauschen",
    category: "Water",
    cadence: "asNeeded",
    who: "Selbst",
    detail:
      "Wenn der Wasserdurchfluss am Dusch-WC geringer wird, Kalkfilter tauschen. Ein Ersatzfilter ist im Haus vorhanden.",
  },
  {
    id: "meter-readings",
    title: "Zählerstände ablesen & übermitteln",
    category: "Water",
    cadence: "annual",
    month: 12,
    who: "Selbst",
    detail:
      "Strom- und Gaszählerstände (Keller) jährlich online an die Versorger übermitteln.",
  },

  // ——— Garden & outdoor ———
  {
    id: "snow",
    title: "Schneeräumen",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Winter",
    who: "Venci Kalapacs",
    detail:
      "Winterdienst/Schneeräumen über Venci Kalapacs (Haus hinter der Metzgerei), 0152 09939325.",
  },
  {
    id: "tree-cut",
    title: "Baumschnitt",
    category: "Garden & outdoor",
    cadence: "annual",
    month: 3,
    who: "Venci Kalapacs",
    detail: "Jährlicher Baum-/Heckenschnitt über Venci Kalapacs, 0152 09939325.",
  },
  {
    id: "mow",
    title: "Rasen mähen",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Apr–Okt",
    who: "Selbst",
    detail:
      "Akku-Rasenmäher und Ladegerät stehen in der Garage.",
  },
  {
    id: "weeds",
    title: "Unkraut im Pflaster entfernen",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Frühjahr/Sommer",
    who: "Selbst",
    detail:
      "Fugen im Pflaster: Wegerein-Konzentrat (Roundup-frei) oder Essigsäure-Reiniger. Keine chemischen Unkrautvernichter auf versiegelten Flächen (verboten).",
  },

  // ——— Appliances ———
  {
    id: "dishwasher-warranty",
    title: "Geschirrspüler-Garantie beachten",
    category: "Appliances",
    cadence: "oneOff",
    nextDue: "2026-10-31",
    who: "Küchenhaus Kornbichler",
    detail:
      "Bosch Serie 4 SPH4HL801E (eingebaut 10/2024). Garantie bis 31.10.2026. Aqua-Stopp-Garantie: ein Geräteleben lang. Rostschutz: 10 Jahre.",
  },

  // ——— Admin ———
  {
    id: "building-insurance",
    title: "Gebäudeversicherung prüfen",
    category: "Admin",
    cadence: "annual",
    month: 11,
    who: "Selbst",
    detail:
      "Wohngebäudeversicherung läuft bei Kauf automatisch auf den Käufer über (§ 95 VVG). Innerhalb 1 Monat nach Grundbucheintrag kündbar — eigene Police mit Elementarschäden abschließen.",
  },
];

// ——— helpers ———
export const cadenceLabel: Record<Cadence, string> = {
  annual: "Jährlich",
  biennial: "Alle 2 Jahre",
  decennial: "Alle 10 Jahre",
  semiannual: "Halbjährlich",
  seasonal: "Saisonal",
  asNeeded: "Bei Bedarf",
  oneOff: "Einmalig / Stichtag",
};

export const monthsDE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export const categoryEmoji: Record<TaskCategory, string> = {
  Safety: "🔔",
  "Heating & gas": "🔥",
  Water: "💧",
  "Garden & outdoor": "🌳",
  Appliances: "🔌",
  Admin: "📄",
};
