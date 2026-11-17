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
    title: "Übergabeprotokoll Kauf",
    category: "Kauf & Übergabe",
    emoji: "📝",
    file: "/admin/docs/00_Uebergabeprotokoll_Kauf.pdf",
    pages: 2,
    summary:
      "Unterschriebenes Übergabeprotokoll (Gantner Immobilien): Schlüssel, Zählerstände, Zustand, Unterschriften.",
  },
  {
    slug: "rund-ums-haus",
    title: "Rund ums Haus — Hinweise",
    category: "Kauf & Übergabe",
    emoji: "🏔️",
    file: "/admin/docs/01_Rund-ums-Haus_Hinweise.pdf",
    pages: 2,
    summary:
      "Handschriftliche Haus-Notizen der Vorbesitzer: Schlösser, Melder, Filter, Zähler, Gastank, Klingel.",
  },
  {
    slug: "schliessanlage",
    title: "Schließanlage & Schlüssel (ABUS)",
    category: "Systeme",
    emoji: "🔑",
    file: "/admin/docs/02_Schliessanlage_Schluessel_ABUS.pdf",
    pages: 2,
    summary: "ABUS-Lieferschein der Schließanlage mit Sicherungskarten-Nummer.",
  },
  {
    slug: "rauchwarnmelder",
    title: "Rauchwarnmelder",
    category: "Systeme",
    emoji: "🔔",
    file: "/admin/docs/03_Rauchwarnmelder.pdf",
    pages: 1,
    summary: "Rechnung Fa. Özkan — 5× Ei Electronics Ei650, 12/2017.",
  },
  {
    slug: "legionellenfilter",
    title: "Legionellen- & Wasserfilter",
    category: "Systeme",
    emoji: "💧",
    file: "/admin/docs/04_Legionellenfilter_Wasserfilter.pdf",
    pages: 2,
    summary: "Sanquell-Rechnung (Duschkopf SAFETY CHROM) + Amazon-Ersatzfilter.",
  },
  {
    slug: "fluessiggas",
    title: "Flüssiggas & Gastank",
    category: "Systeme",
    emoji: "⛽",
    file: "/admin/docs/05_Fluessiggas_Gastank.pdf",
    pages: 5,
    summary:
      "Gaslieferung, Prüf-Bestellung, Eigentumsnachweis 1997 sowie äußere und innere Prüfbescheinigung (TÜV).",
  },
  {
    slug: "geschirrspueler",
    title: "Geschirrspüler (Bosch)",
    category: "Geräte",
    emoji: "🍽️",
    file: "/admin/docs/06_Geschirrspueler_Bosch.pdf",
    pages: 2,
    summary: "Kornbichler-Rechnung Bosch Serie 4 inkl. Garantie-Notizen.",
  },
  {
    slug: "staubsauger",
    title: "Akku-Staubsauger (Dreame)",
    category: "Geräte",
    emoji: "🧹",
    file: "/admin/docs/07_Staubsauger_Dreame.pdf",
    pages: 1,
    summary: "eBay-Beleg Xiaomi Dreame V10.",
  },
  {
    slug: "garten",
    title: "Garten — Unkrautvernichter",
    category: "Garten",
    emoji: "🌳",
    file: "/admin/docs/08_Garten_Unkrautvernichter.pdf",
    pages: 1,
    summary: "PaintSystems-Beleg — Fugen-/Pflasterreiniger.",
  },
  {
    slug: "handwerker",
    title: "Handwerker & Lieferanten",
    category: "Kontakte",
    emoji: "🧰",
    file: "/admin/docs/09_Handwerker_und_Lieferanten.pdf",
    pages: 2,
    summary: "Handschriftliche Kontaktliste der Vorbesitzer.",
  },
  {
    slug: "essen-trinken",
    title: "Essen & Trinken",
    category: "Kontakte",
    emoji: "🥨",
    file: "/admin/docs/10_Essen_und_Trinken.pdf",
    pages: 1,
    summary: "Handschriftliche Tipps: Bäcker, Metzger, Gasthäuser.",
  },
];
