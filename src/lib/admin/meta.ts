// Property / handover facts for Reitberg 16. Owner-facing admin only.
// Transcribed from the handwritten handover notes and the signed
// handover protocol (Gantner Immobilien). Edit freely.

export const property = {
  address: "Reitberg 16, 83735 Bayrischzell",
  type: "Detached house (EFH)",
  flurnummer: "475/11",
  gemeinde: "Bayrischzell",
  landkreis: "Miesbach district",
  bundesland: "Bavaria",
  buyers: "Lukas Bresser & Caroline du Pont Noonan",
  sellers: "Wolfgang & Evelyn Märtin",
  agent: "Gantner Immobilien · Thomas Gantner · +49 (0)172 880 2442 · tg@gantner-immobilien.com",
  handoverDate: "2025-11-17",
};

// Keys handed over at the handover.
export const keys = [
  { what: "Front door (master-keyed system, all locks alike)", count: 10 },
  { what: "Letterbox", count: 2 },
  { what: "Garage (remote)", count: 1 },
];

// Baseline meter readings on handover day — the numbers you hand to each
// utility when you register the change of owner.
export const meters = [
  {
    kind: "Electricity",
    reading: "4,434 kWh",
    meterNo: "1645 774 X 4717 0129",
    note: "Reading on handover day. Meter is in the cellar.",
  },
  {
    kind: "Gas (LPG meter)",
    reading: "698 m³",
    meterNo: "4408 5925",
    note: "Gas meter measures the gas vaporised from the LPG tank. Meter is in the cellar.",
  },
];
