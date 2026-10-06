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
  images: string[]; // leave empty [] to show a "photo coming soon" placeholder
};

// The four rooms of The Haus. Sizes are approximate, read off the original
// floor plans (Grundriss EG / OG). Photos aren't in yet, so `images` is empty
// and the site shows tasteful placeholders. PRs welcome.
export const rooms: Room[] = [
  {
    slug: "luxury",
    name: "Luxury",
    short: "The master bedroom, with its own balcony over the garden.",
    description:
      "The best room in the house — the old Elternschlafzimmer. A king bed, French doors onto a private balcony facing the garden and the mountains, and the main bathroom just across the hall. Wake up to the Wendelstein.",
    sleeps: 2,
    bed: "1 king",
    size: "~16 m²",
    view: "Balcony & mountains",
    amenities: ["Private balcony", "Mountain view", "King bed", "Bathroom across the hall", "Reading chairs"],
    images: ["/rooms/luxury.webp"],
  },
  {
    slug: "mountain-view",
    name: "Mountain View",
    short: "Upstairs corner room looking straight at the Wendelstein.",
    description:
      "A bright upper-floor room with big windows framing the mountain and plenty of morning sun. A queen bed and a desk in the corner — the nicest spot in the house to sit with a coffee and a map of tomorrow's hike.",
    sleeps: 2,
    bed: "1 queen",
    size: "~13 m²",
    view: "Wendelstein",
    amenities: ["Mountain view", "Morning sun", "Queen bed", "Desk", "Upstairs & quiet"],
    images: ["/rooms/mountain-view.webp"],
  },
  {
    slug: "kids-paradise",
    name: "Kids' Paradise",
    short: "Three beds, balcony access, and room to make a den.",
    description:
      "Built for a tribe of small people. Three single beds, space on the floor for games, and a door onto the balcony. Blackout blinds for proper lie-ins and a shelf of books and toys. Grown-ups welcome too.",
    sleeps: 3,
    bed: "3 singles",
    size: "~14 m²",
    view: "Garden & balcony",
    amenities: ["Three single beds", "Balcony access", "Blackout blinds", "Books & toys", "Upstairs"],
    images: ["/rooms/kids-paradise.webp"],
  },
  {
    slug: "the-studio",
    name: "The Studio",
    short: "A snug ground-floor room, handy for the garden.",
    description:
      "A cosy little ground-floor room just off the living area — the old Geräteraum, now a quiet bolt-hole with a queen bed. Steps from the kitchen and the garden door, and the easiest room to slip in and out of after a late walk.",
    sleeps: 2,
    bed: "1 queen",
    size: "~8 m²",
    view: "Garden",
    amenities: ["Ground floor", "Queen bed", "Garden access", "Steps from the kitchen", "Snug & quiet"],
    images: [],
  },
];

export function getRoom(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}
