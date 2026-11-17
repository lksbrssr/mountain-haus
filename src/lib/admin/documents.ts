// Scanned handover documents, split out of the original single PDF and
// stored in /public/admin/docs. Each entry links to its sub-file.

export type HouseDoc = {
  slug: string;
  title: string;
  category: string;
  emoji: string;
  file: string; // path under /public
  pages: number;
  summary: string;
};

export const documents: HouseDoc[] = [
  {
    slug: "uebergabeprotokoll",
    title: "Handover protocol",
    category: "Purchase & handover",
    emoji: "📝",
    file: "/admin/docs/00_Uebergabeprotokoll_Kauf.pdf",
    pages: 2,
    summary:
      "Signed handover protocol (Gantner Immobilien): keys, meter readings, condition, signatures.",
  },
  {
    slug: "rund-ums-haus",
    title: "Around the house — notes",
    category: "Purchase & handover",
    emoji: "🏔️",
    file: "/admin/docs/01_Rund-ums-Haus_Hinweise.pdf",
    pages: 2,
    summary:
      "The previous owners' handwritten house notes: locks, detectors, filters, meters, gas tank, doorbell.",
  },
  {
    slug: "schliessanlage",
    title: "Locks & keys (ABUS)",
    category: "Systems",
    emoji: "🔑",
    file: "/admin/docs/02_Schliessanlage_Schluessel_ABUS.pdf",
    pages: 2,
    summary: "ABUS delivery note for the locking system, with the security-card number.",
  },
  {
    slug: "rauchwarnmelder",
    title: "Smoke detectors",
    category: "Systems",
    emoji: "🔔",
    file: "/admin/docs/03_Rauchwarnmelder.pdf",
    pages: 1,
    summary: "Fa. Özkan invoice — 5× Ei Electronics Ei650, 12/2017.",
  },
  {
    slug: "legionellenfilter",
    title: "Legionella & water filters",
    category: "Systems",
    emoji: "💧",
    file: "/admin/docs/04_Legionellenfilter_Wasserfilter.pdf",
    pages: 2,
    summary: "Sanquell invoice (SAFETY CHROM shower head) + Amazon replacement filter.",
  },
  {
    slug: "fluessiggas",
    title: "LPG & gas tank",
    category: "Systems",
    emoji: "⛽",
    file: "/admin/docs/05_Fluessiggas_Gastank.pdf",
    pages: 5,
    summary:
      "Gas delivery, inspection order, 1997 proof of ownership, plus external and internal inspection certificates (TÜV).",
  },
  {
    slug: "geschirrspueler",
    title: "Dishwasher (Bosch)",
    category: "Appliances",
    emoji: "🍽️",
    file: "/admin/docs/06_Geschirrspueler_Bosch.pdf",
    pages: 2,
    summary: "Kornbichler invoice for the Bosch Serie 4, with warranty notes.",
  },
  {
    slug: "staubsauger",
    title: "Cordless vacuum (Dreame)",
    category: "Appliances",
    emoji: "🧹",
    file: "/admin/docs/07_Staubsauger_Dreame.pdf",
    pages: 1,
    summary: "eBay receipt for the Xiaomi Dreame V10.",
  },
  {
    slug: "garten",
    title: "Garden — weed control",
    category: "Garden",
    emoji: "🌳",
    file: "/admin/docs/08_Garten_Unkrautvernichter.pdf",
    pages: 1,
    summary: "PaintSystems receipt — paving-joint cleaner.",
  },
  {
    slug: "handwerker",
    title: "Tradespeople & suppliers",
    category: "Contacts",
    emoji: "🧰",
    file: "/admin/docs/09_Handwerker_und_Lieferanten.pdf",
    pages: 2,
    summary: "The previous owners' handwritten contact list.",
  },
  {
    slug: "essen-trinken",
    title: "Food & drink",
    category: "Contacts",
    emoji: "🥨",
    file: "/admin/docs/10_Essen_und_Trinken.pdf",
    pages: 1,
    summary: "Handwritten tips: bakeries, butchers, inns.",
  },
];
