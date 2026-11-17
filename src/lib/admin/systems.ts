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
    name: "Locks & keys",
    emoji: "🔑",
    summary:
      "An ABUS master-keyed system is fitted — every lock opens with the same key. The security card (ID card) is with the documents and is needed to order extra keys.",
    specs: [
      { label: "System", value: "ABUS Wavy Line 6K (WL410/WL452)" },
      { label: "Security card", value: "SWL 64233" },
      { label: "Number of keys", value: "15 (10 handed over for the front door)" },
      { label: "Dealer", value: "Sicherheitstechnik Feldmann, Munich · 089 20232216" },
    ],
    howto: [
      "Order extra keys only with the security card, via the dealer.",
      "Keep the security card safe — no copies without it.",
    ],
    docSlug: "schliessanlage",
  },
  {
    id: "heating",
    name: "Heating",
    emoji: "🔥",
    summary:
      "Brötje WGO 25 boiler from 1997, running on LPG from the underground tank. Serviced annually by Fa. Auracher.",
    specs: [
      { label: "Boiler", value: "Brötje WGO 25, no. 431297" },
      { label: "Year", value: "1997" },
      { label: "Fuel", value: "LPG (propane/butane) from underground tank" },
      { label: "Service", value: "Fa. Auracher Haustechnik, Fischbachau" },
    ],
    howto: [
      "Service yearly before the heating season (autumn).",
      "The chimney sweep does the flue-gas measurement / fireplace inspection.",
    ],
  },
  {
    id: "gastank",
    name: "LPG tank",
    emoji: "⛽",
    summary:
      "Underground LPG tank (6,400 L), owned — no rental contract, free choice of supplier. Two statutory inspections: external every 2 years, internal every 10 years.",
    specs: [
      { label: "Size", value: "6,400 L (2.9 t) · max fill 80% ≈ 5,120 L" },
      { label: "Maker / year", value: "Ermert · 1997 · underground" },
      { label: "Tank no.", value: "738793 / 738795" },
      { label: "External inspection", value: "every 2 yrs · last 28/05/2024 · next 2026" },
      { label: "Internal inspection", value: "every 10 yrs · last 16/06/2020 · next 06/2030" },
      { label: "Proof of ownership", value: "SANO-Propan invoice, 1997" },
    ],
    howto: [
      "Check the level before winter and reorder in good time (Gloria-Gas / H+H).",
      "Book both inspections through the gas supplier — don't miss the deadlines.",
    ],
    docSlug: "fluessiggas",
  },
  {
    id: "smoke",
    name: "Smoke detectors",
    emoji: "🔔",
    summary:
      "Ei Electronics Ei650 with a sealed 10-year battery and magnetic mount. Test yearly; the whole set is due for replacement in 2027.",
    specs: [
      { label: "Model", value: "Ei Electronics Ei650 (5 units)" },
      { label: "Fitted", value: "12/2017 (Fa. Özkan)" },
      { label: "Battery", value: "10-year sealed — set expires 2027" },
    ],
    howto: [
      "Test once a year with the test button.",
      "If one misbehaves, swap the unit — magnetic mount, no tools.",
    ],
    docSlug: "rauchwarnmelder",
  },
  {
    id: "water",
    name: "Water & filters",
    emoji: "💧",
    summary:
      "Very hard water. Descale the tap aerators with citric acid (never vinegar). Replace the shower-head legionella filter (parents' bathroom) and the shower-WC limescale filter when flow drops.",
    specs: [
      { label: "Shower-head filter", value: "SAFETY CHROM with legionella filter (parents' bath, 1st floor)" },
      { label: "Replacement filter", value: "Amazon / eBay (~€69)" },
      { label: "Shower-WC", value: "Limescale filter — spare in the house" },
    ],
    howto: [
      "Aerators: citric acid, never vinegar.",
      "Replace filters as soon as the spray noticeably weakens.",
    ],
    docSlug: "legionellenfilter",
  },
  {
    id: "doorbell",
    name: "Front doorbell",
    emoji: "🔕",
    summary:
      "The original doorbell was destroyed by a lightning strike. A wireless doorbell is now fitted and needs fresh batteries roughly every 6 months.",
    specs: [{ label: "Type", value: "Wireless doorbell (battery-powered)" }],
    howto: ["Change the batteries about twice a year."],
  },
];
