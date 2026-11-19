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
  underConstruction?: boolean; // true = shown but not bookable (work in progress)
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
    name: "Kids' Corner",
    short: "The kids' room — a bunk bed and two singles, sleeps four.",
    description:
      "A bright upper-floor corner room with big south-facing windows over the Seebergschneid. A bunk bed and two single beds sleep four, with room on the floor for games and a shelf of books and toys — the kids' own corner of the haus.",
    sleeps: 4,
    bed: "Bunk bed + 2 singles",
    size: "~13 m²",
    view: "Seebergschneid",
    amenities: ["Sleeps four", "Bunk bed + 2 singles", "South-facing", "Mountain view", "Books & toys"],
    images: ["/rooms/mountain-view.webp"],
  },
  {
    slug: "kids-paradise",
    name: "East Wing",
    short: "A calm upstairs double with a king bed and balcony access.",
    description:
      "An upstairs room with its own door onto the balcony and blackout blinds for proper lie-ins. A king bed, garden and balcony views, and a quiet corner away from the bustle.",
    sleeps: 2,
    bed: "1 king",
    size: "~14 m²",
    view: "Garden & balcony",
    amenities: ["King bed", "Balcony access", "Blackout blinds", "Garden view", "Upstairs"],
    images: ["/rooms/kids-paradise.webp"],
  },
  {
    slug: "the-studio",
    name: "The Studio",
    short: "A snug ground-floor room with its own door to the garden.",
    description:
      "A cosy little ground-floor room just off the living area. Steps from the kitchen and the garden door, and the easiest room to slip in and out of after a late walk.",
    sleeps: 2,
    bed: "1 queen",
    size: "~8 m²",
    view: "Garden",
    amenities: ["Ground floor", "Queen bed", "Garden access", "Steps from the kitchen", "Snug & quiet"],
    images: ["/rooms/the-studio-1.webp", "/rooms/the-studio-2.webp"],
  },
];

export function getRoom(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}
