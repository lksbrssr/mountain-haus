// Property / handover facts for Reitberg 16. Owner-facing admin only.
// Transcribed from the handwritten handover notes and the signed
// Übergabeprotokoll (Gantner Immobilien). Edit freely.

export const property = {
  address: "Reitberg 16, 83735 Bayrischzell",
  type: "Einfamilienhaus (EFH)",
  flurnummer: "475/11",
  gemeinde: "Bayrischzell",
  landkreis: "Miesbach",
  bundesland: "Bayern",
  buyers: "Lukas Bresser & Caroline du Pont Noonan",
  sellers: "Wolfgang & Evelyn Märtin",
  agent: "Gantner Immobilien · Thomas Gantner · +49 (0)172 880 2442 · tg@gantner-immobilien.com",
  handoverDate: "2025-11-17",
};

// Keys handed over at the Übergabe.
export const keys = [
  { what: "Hauseingang (Schließanlage, alle Schlösser gleich)", count: 10 },
  { what: "Briefkasten", count: 2 },
  { what: "Garage (Fernbedienung)", count: 1 },
];

// Baseline meter readings on handover day — the numbers you hand to each
// utility when you register the change of owner.
export const meters = [
  {
    kind: "Strom",
    reading: "4.434 kWh",
    meterNo: "1645 774 X 4717 0129",
    note: "Zählerstand am Übergabetag. Zähler im Keller.",
  },
  {
    kind: "Gas (Flüssiggas-Zähler)",
    reading: "698 m³",
    meterNo: "4408 5925",
    note: "Gaszähler misst das aus dem Flüssiggastank verdampfte Gas. Zähler im Keller.",
  },
];
