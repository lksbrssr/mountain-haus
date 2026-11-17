// Tradespeople, suppliers, neighbours and local tips for Reitberg 16.
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
    trade: "Heating / water / plumbing",
    phone: "08028 418468 · Mr Auracher 0174 7474754 · Mr Stöger 0175 4675551",
    location: "Fischbachau",
    note: "Looks after the heating system (Brötje WGO 25, 1997). Mr Stöger has known the house for ~16 years.",
  },
  {
    name: "Fa. Thaler",
    trade: "Roofer & tinsmith",
    phone: "08023 373",
    location: "Bayrischzell / Geitau",
  },
  {
    name: "Fa. Huber",
    trade: "Gardener · paving · terrace slabs",
    phone: "08023 718",
    location: "Bayrischzell",
  },
  {
    name: "Fa. Zdovz",
    trade: "Carpentry / joinery",
    phone: "08023 9133",
    location: "Bayrischzell",
  },
  {
    name: "Ralf Krieglmeier",
    trade: "Chimney sweep (Kaminkehrer)",
    phone: "08666 228057 · 0176 20236576",
    note: "District chimney sweep — fireplace inspection & flue-gas measurement.",
  },
  {
    name: "Gloria-Gas (Dr. Fuchs GmbH)",
    trade: "LPG supplier",
    phone: "089 87181111",
    location: "Munich",
    note: "Tank refills and booking the tank inspections.",
  },
  {
    name: "H+H Flüssiggas",
    trade: "LPG supplier (alternative)",
    phone: "0821 2678926",
  },
  {
    name: "Venci Kalapacs",
    trade: "Snow clearing & tree pruning",
    phone: "0152 09939325",
    location: "Bayrischzell (house behind the butcher's)",
  },
  {
    name: "Auto Fischer",
    trade: "Car garage (all makes)",
    location: "Alpenstr., Bayrischzell-Osterhofen",
  },
  {
    name: "Küchenhaus Kornbichler",
    trade: "Kitchen / appliances (dishwasher)",
    phone: "08023 9399960",
    location: "Oskar-von-Miller-Str. 26, 83714 Miesbach",
  },
  {
    name: "Electrician",
    trade: "Electrical",
    note: "The previous electrician has passed away and the firm has closed — find a new electrician.",
  },
];

export const neighbours: Contact[] = [
  {
    name: "WGB Hausham · Mr Friedrich",
    trade: "Neighbour / owner of Reitberg 12 & 14",
    phone: "08026 9256-11",
  },
  {
    name: "Beekeeper Freyermuth",
    trade: "Neighbour, Reitberg 14 · honey direct",
    phone: "08023 328",
  },
  {
    name: "Mr Lill",
    trade: "Recycling centre (contact)",
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
    kind: "Bakery",
    phone: "08023 8199777",
    location: "Bayrischzell",
    note: "Bread: Bayrischzeller Landbrot, 1 kg.",
  },
  {
    name: "Bäckerei Gritscher",
    kind: "Bakery / patisserie",
    phone: "08026 71152",
    location: "Schliersee-Josefsthal",
    note: "Whole cakes & tortes to order, e.g. raspberry cake.",
  },
  {
    name: "Beekeeper Freyermuth",
    kind: "Honey direct",
    phone: "08023 328",
    location: "Reitberg 14 (neighbour)",
  },
  {
    name: "Metzgerei Linner",
    kind: "Butcher",
    location: "Bayrischzell",
  },
  {
    name: "Metzgerei Leitner / Gasthaus Hammerwirt",
    kind: "Butcher & inn",
    phone: "08028 9166",
    location: "Hagnbergstr. 4, 83730 Fischbachau",
  },
  {
    name: "EDEKA",
    kind: "Supermarket",
    location: "Bayrischzell",
  },
  {
    name: "Gasthaus Aiplspitz",
    kind: "Inn (from 17:00)",
    phone: "08023 646",
    location: "Geitau",
    note: "Alain & Annette Delgay.",
  },
  {
    name: "Gasthaus Rote Wand",
    kind: "Inn",
    location: "Geitau",
  },
  {
    name: "Hofhaus am See",
    kind: "Restaurant",
    phone: "08026 94499",
    location: "Schliersee",
    note: "Speciality: local fish.",
  },
];
