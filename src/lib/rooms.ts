export type Room = {
  slug: string;
  name: string;
  short: string;
  description: string;
  sleeps: number;
  bed: string;
  size: string;
  view: string;
  amenities: string[];
  images: string[];
};

// Add or edit rooms here — this is the easiest thing to PR.
export const rooms: Room[] = [
  {
    slug: "lake-view-suite",
    name: "The Lake View Suite",
    short: "Corner suite with a wall of windows over the water.",
    description:
      "The best seat in the house. Floor-to-ceiling windows frame the lake, a reading nook catches the afternoon sun, and the bathroom has a deep soaking tub. Wake up to mist on the water.",
    sleeps: 2,
    bed: "1 king",
    size: "32 m²",
    view: "Lake & Alps",
    amenities: ["Lake view", "Soaking tub", "Nespresso", "Reading nook", "Underfloor heating"],
    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "garden-room",
    name: "The Garden Room",
    short: "Ground-floor room opening straight onto the herb garden.",
    description:
      "Step out of bed and into the garden. French doors open onto a private patch of lavender and rosemary, with a small patio for morning coffee. Calm, green, and close to the kitchen.",
    sleeps: 2,
    bed: "1 queen",
    size: "26 m²",
    view: "Garden",
    amenities: ["Private patio", "Garden access", "Nespresso", "Rain shower", "Desk"],
    images: [
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "the-loft",
    name: "The Loft",
    short: "Beam-ceilinged hideaway at the top of the house.",
    description:
      "Up under the eaves: exposed beams, a skylight for stargazing, and a cosy pitched ceiling. The quietest room in the house and a favourite for longer stays.",
    sleeps: 3,
    bed: "1 queen + 1 single",
    size: "30 m²",
    view: "Treetops",
    amenities: ["Skylight", "Exposed beams", "Nespresso", "Rain shower", "Extra single bed"],
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "the-cabin",
    name: "The Boathouse Cabin",
    short: "Standalone cabin at the water's edge.",
    description:
      "A little wood cabin all to yourself, ten steps from the jetty. Swim before breakfast, nap to the sound of the water, and light the wood stove when it cools. Dogs welcome.",
    sleeps: 4,
    bed: "1 king + sofa bed",
    size: "40 m²",
    view: "Jetty & lake",
    amenities: ["Private cabin", "Wood stove", "Kitchenette", "Jetty access", "Dog friendly"],
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=1600&q=80",
    ],
  },
];

export function getRoom(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}
