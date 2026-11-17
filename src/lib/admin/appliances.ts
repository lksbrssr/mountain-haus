// Appliances & equipment that came with (or were bought for) Reitberg 16.

export type Appliance = {
  name: string;
  brand: string;
  emoji: string;
  bought?: string;
  price?: string;
  warranty?: string;
  location?: string;
  note?: string;
  docSlug?: string;
};

export const appliances: Appliance[] = [
  {
    name: "Dishwasher",
    brand: "Bosch Serie 4 SPH4HL801E (fully integrated, 45 cm)",
    emoji: "🍽️",
    bought: "10/2024 (Küchenhaus Kornbichler)",
    price: "€979 incl. fitting",
    warranty: "Warranty to 31/10/2026 · AquaStop: lifetime of appliance · anti-rust: 10 yrs",
    docSlug: "geschirrspueler",
  },
  {
    name: "Cordless vacuum",
    brand: "Xiaomi Dreame V10 (cordless, 22 kPa)",
    emoji: "🧹",
    bought: "08/2020 (eBay)",
    price: "€199.99",
    docSlug: "staubsauger",
  },
  {
    name: "Lawn mower",
    brand: "Cordless lawn mower + charger",
    emoji: "🌱",
    location: "Garage",
    note: "Mower and charger are in the garage.",
  },
];
