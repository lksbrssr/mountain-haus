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
    name: "Geschirrspüler",
    brand: "Bosch Serie 4 SPH4HL801E (vollintegriert, 45 cm)",
    emoji: "🍽️",
    bought: "10/2024 (Küchenhaus Kornbichler)",
    price: "979 € inkl. Montage",
    warranty: "Garantie bis 31.10.2026 · Aqua-Stopp: ein Geräteleben · Rostschutz: 10 J",
    docSlug: "geschirrspueler",
  },
  {
    name: "Akku-Staubsauger",
    brand: "Xiaomi Dreame V10 (kabellos, 22 kPa)",
    emoji: "🧹",
    bought: "08/2020 (eBay)",
    price: "199,99 €",
    docSlug: "staubsauger",
  },
  {
    name: "Rasenmäher",
    brand: "Akku-Rasenmäher + Ladegerät",
    emoji: "🌱",
    location: "Garage",
    note: "Gerät und Ladegerät stehen in der Garage.",
  },
];
