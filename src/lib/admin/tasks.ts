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
    title: "Test smoke detectors",
    category: "Safety",
    cadence: "annual",
    month: 10,
    who: "DIY",
    detail:
      "Test every detector once a year with the test button. They're Ei Electronics Ei650 with a sealed 10-year battery. If one misbehaves, swap the whole unit — magnetic mount, no tools needed.",
  },
  {
    id: "smoke-replace",
    title: "Replace smoke detectors (10-year end of life)",
    category: "Safety",
    cadence: "oneOff",
    nextDue: "2027",
    who: "DIY / eBay (totumlu)",
    detail:
      "The detectors were fitted 12/2017 (Fa. Özkan); the 10-year battery expires in 2027. Replace the full set of 5 Ei650 units.",
  },
  {
    id: "doorbell-batteries",
    title: "Change wireless doorbell batteries",
    category: "Safety",
    cadence: "semiannual",
    who: "DIY",
    detail:
      "The original hardwired doorbell was destroyed by a lightning strike; a wireless doorbell is fitted. It needs fresh batteries roughly every 6 months.",
  },

  // ——— Heating & gas ———
  {
    id: "boiler-service",
    title: "Service the boiler (Brötje WGO 25, 1997)",
    category: "Heating & gas",
    cadence: "annual",
    month: 9,
    who: "Fa. Auracher Haustechnik",
    detail:
      "Annual service of the heating system (Brötje WGO 25, no. 431297) before the heating season. Mr Auracher 0174 7474754 or Mr Stöger 0175 4675551.",
  },
  {
    id: "gas-ext-inspection",
    title: "LPG tank — external inspection (Äußere Prüfung)",
    category: "Heating & gas",
    cadence: "biennial",
    lastDone: "2024-05-28",
    nextDue: "2026",
    who: "Gas supplier / Schenk Tanktransport",
    detail:
      "Recurring external inspection every 2 years (tank < 3 t). Last done 28/05/2024, next due 2026. Book it through the gas supplier. Costs ~€79.",
  },
  {
    id: "gas-int-inspection",
    title: "LPG tank — internal inspection (Innere Prüfung)",
    category: "Heating & gas",
    cadence: "decennial",
    lastDone: "2020-06-16",
    nextDue: "2030-06",
    who: "Gas supplier / TÜV Austria",
    detail:
      "Internal inspection every 10 years (pressure vessel). Last done 16/06/2020 (TÜV Austria, no defects), next due 06/2030. Book it through the gas supplier.",
  },
  {
    id: "gas-level",
    title: "Check LPG tank level & reorder if needed",
    category: "Heating & gas",
    cadence: "annual",
    month: 9,
    who: "Gloria-Gas / H+H Flüssiggas",
    detail:
      "Read the level before winter and reorder in good time. Tank holds 6,400 L, max fill 80% ≈ 5,120 L. Level on 19/10/26 was ~4,480 L. Delivery takes longer during the heating season.",
  },

  // ——— Water ———
  {
    id: "perlatoren",
    title: "Descale the tap aerators",
    category: "Water",
    cadence: "asNeeded",
    who: "DIY",
    detail:
      "The water is very hard. Descale the aerators (Perlatoren) with citric acid — never vinegar (it attacks the seals and chrome).",
  },
  {
    id: "legionella-filter",
    title: "Replace shower-head legionella filter",
    category: "Water",
    cadence: "asNeeded",
    who: "DIY / Amazon",
    detail:
      "The SAFETY CHROM shower head in the parents' bathroom (1st floor) has a built-in legionella filter. When the spray weakens, fit a replacement filter (Amazon / eBay, ~€69).",
  },
  {
    id: "kalkfilter-wc",
    title: "Replace limescale filter on the shower-WC",
    category: "Water",
    cadence: "asNeeded",
    who: "DIY",
    detail:
      "When water flow at the shower-WC drops, replace the limescale filter. A spare filter is in the house.",
  },
  {
    id: "meter-readings",
    title: "Read & submit meter readings",
    category: "Water",
    cadence: "annual",
    month: 12,
    who: "DIY",
    detail:
      "Submit the electricity and gas meter readings (cellar) to the utilities online each year.",
  },

  // ——— Garden & outdoor ———
  {
    id: "snow",
    title: "Snow clearing",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Winter",
    who: "Venci Kalapacs",
    detail:
      "Winter snow-clearing via Venci Kalapacs (house behind the butcher's), 0152 09939325.",
  },
  {
    id: "tree-cut",
    title: "Tree & hedge pruning",
    category: "Garden & outdoor",
    cadence: "annual",
    month: 3,
    who: "Venci Kalapacs",
    detail: "Annual tree/hedge pruning via Venci Kalapacs, 0152 09939325.",
  },
  {
    id: "mow",
    title: "Mow the lawn",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Apr–Oct",
    who: "DIY",
    detail: "The cordless mower and charger are in the garage.",
  },
  {
    id: "weeds",
    title: "Clear weeds from the paving",
    category: "Garden & outdoor",
    cadence: "seasonal",
    season: "Spring/Summer",
    who: "DIY",
    detail:
      "Paving joints: Wegerein concentrate (Roundup-free) or an acetic-acid cleaner. No chemical weedkillers on sealed surfaces (it's prohibited).",
  },

  // ——— Appliances ———
  {
    id: "dishwasher-warranty",
    title: "Mind the dishwasher warranty",
    category: "Appliances",
    cadence: "oneOff",
    nextDue: "2026-10-31",
    who: "Küchenhaus Kornbichler",
    detail:
      "Bosch Serie 4 SPH4HL801E (installed 10/2024). Warranty until 31/10/2026. AquaStop guarantee: lifetime of the appliance. Anti-rust: 10 years.",
  },

  // ——— Admin ———
  {
    id: "building-insurance",
    title: "Review buildings insurance",
    category: "Admin",
    cadence: "annual",
    month: 11,
    who: "DIY",
    detail:
      "The buildings insurance passes automatically to the buyer on purchase (§ 95 VVG). You can cancel within 1 month of the land-registry entry — take out your own policy including natural-hazard cover (Elementarschäden).",
  },
];

// ——— helpers ———
export const cadenceLabel: Record<Cadence, string> = {
  annual: "Yearly",
  biennial: "Every 2 years",
  decennial: "Every 10 years",
  semiannual: "Twice a year",
  seasonal: "Seasonal",
  asNeeded: "As needed",
  oneOff: "One-off / deadline",
};

export const monthsEN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const categoryEmoji: Record<TaskCategory, string> = {
  Safety: "🔔",
  "Heating & gas": "🔥",
  Water: "💧",
  "Garden & outdoor": "🌳",
  Appliances: "🔌",
  Admin: "📄",
};
