// Handwerker, Lieferanten, Nachbarn und lokale Tipps für Reitberg 16.
// Transcribed from the handwritten "Handwerker und Lieferanten" and
// "Essen und Trinken" notes.

export type Contact = {
  name: string;
  trade: string;
  phone?: string;
  location?: string;
  note?: string;
};

export const tradespeople: Contact[] = [
  {
    name: "Fa. Auracher Haustechnik",
    trade: "Heizung / Wasser / Sanitär",
    phone: "08028 418468 · Hr. Auracher 0174 7474754 · Hr. Stöger 0175 4675551",
    location: "Fischbachau",
    note: "Betreut die Heizungsanlage (Brötje WGO 25, Bj. 1997). Hr. Stöger kennt das Haus seit ~16 Jahren.",
  },
  {
    name: "Fa. Thaler",
    trade: "Dachdecker & Spengler",
    phone: "08023 373",
    location: "Bayrischzell / Geitau",
  },
  {
    name: "Fa. Huber",
    trade: "Gärtner · Pflaster · Terrassenplatten",
    phone: "08023 718",
    location: "Bayrischzell",
  },
  {
    name: "Fa. Zdovz",
    trade: "Schreinerei",
    phone: "08023 9133",
    location: "Bayrischzell",
  },
  {
    name: "Ralf Krieglmeier",
    trade: "Kaminkehrer / Schornsteinfeger",
    phone: "08666 228057 · 0176 20236576",
    note: "Zuständiger Bezirkskaminkehrer — Feuerstättenschau & Abgasmessung.",
  },
  {
    name: "Gloria-Gas (Dr. Fuchs GmbH)",
    trade: "Flüssiggas-Lieferant",
    phone: "089 87181111",
    location: "München",
    note: "Tankbefüllung und Anmeldung der Tankprüfungen.",
  },
  {
    name: "H+H Flüssiggas",
    trade: "Flüssiggas-Lieferant (Alternative)",
    phone: "0821 2678926",
  },
  {
    name: "Venci Kalapacs",
    trade: "Schneeräumen & Baumschnitt",
    phone: "0152 09939325",
    location: "Bayrischzell (Haus hinter der Metzgerei)",
  },
  {
    name: "Auto Fischer",
    trade: "KFZ-Werkstatt (alle Marken)",
    location: "Alpenstr., Bayrischzell-Osterhofen",
  },
  {
    name: "Küchenhaus Kornbichler",
    trade: "Küche / Geräte (Geschirrspüler)",
    phone: "08023 9399960",
    location: "Oskar-von-Miller-Str. 26, 83714 Miesbach",
  },
  {
    name: "Elektriker",
    trade: "Elektro",
    note: "Der frühere Elektriker ist verstorben, Betrieb geschlossen — neuen Elektriker suchen.",
  },
];

export const neighbours: Contact[] = [
  {
    name: "WGB Hausham · Gf. Hr. Friedrich",
    trade: "Nachbar / Eigentümer Reitberg 12 & 14",
    phone: "08026 9256-11",
  },
  {
    name: "Imker Freyermuth",
    trade: "Nachbar Reitberg 14 · Honig direkt",
    phone: "08023 328",
  },
  {
    name: "Hr. Lill",
    trade: "Wertstoffhof (Ansprechpartner)",
    phone: "0174 7056688",
  },
];

export type FoodTip = {
  name: string;
  kind: string;
  phone?: string;
  location?: string;
  note?: string;
};

export const foodTips: FoodTip[] = [
  {
    name: "Bio-Bäckerei Butz",
    kind: "Bäckerei",
    phone: "08023 8199777",
    location: "Bayrischzell",
    note: "Brot: Bayrischzeller Landbrot 1 kg.",
  },
  {
    name: "Bäckerei Gritscher",
    kind: "Bäckerei / Konditorei",
    phone: "08026 71152",
    location: "Schliersee-Josefsthal",
    note: "Ganze Kuchen & Torten auf Bestellung, z. B. Himbeerkuchen.",
  },
  {
    name: "Imker Freyermuth",
    kind: "Honig direkt",
    phone: "08023 328",
    location: "Reitberg 14 (Nachbar)",
  },
  {
    name: "Metzgerei Linner",
    kind: "Metzgerei",
    location: "Bayrischzell",
  },
  {
    name: "Metzgerei Leitner / Gasthaus Hammerwirt",
    kind: "Metzgerei & Gasthaus",
    phone: "08028 9166",
    location: "Hagnbergstr. 4, 83730 Fischbachau",
  },
  {
    name: "EDEKA",
    kind: "Supermarkt",
    location: "Bayrischzell",
  },
  {
    name: "Gasthaus Aiplspitz",
    kind: "Gasthaus (ab 17:00)",
    phone: "08023 646",
    location: "Geitau",
    note: "Alain & Annette Delgay.",
  },
  {
    name: "Gasthaus Rote Wand",
    kind: "Gasthaus",
    location: "Geitau",
  },
  {
    name: "Hofhaus am See",
    kind: "Restaurant",
    phone: "08026 94499",
    location: "Schliersee",
    note: "Spezialität: heimischer Fisch.",
  },
];
