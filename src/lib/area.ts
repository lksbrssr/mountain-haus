export type Activity = {
  title: string;
  kind: string;
  season: string;
  description: string;
  link: string;
  emoji: string;
};

// Things to do around The Haus. PRs welcome — add your own favourites.
export const activities: Activity[] = [
  {
    title: "Ski the Sudelfeld",
    kind: "Skiing & snowboarding",
    season: "Winter",
    emoji: "⛷️",
    description:
      "One of Bavaria's biggest ski areas is right on the doorstep — 31 km of wide, family-friendly runs in the Wendelstein region, with modern 6- and 8-seat chairlifts. Perfect for a half-day on the snow.",
    link: "https://www.sudelfeld.de/",
  },
  {
    title: "Hike to the Rotwandhaus",
    kind: "Mountain hike",
    season: "Late spring–autumn",
    emoji: "🥾",
    description:
      "A classic. From Spitzingsee it's a roughly 2.5–3 hour climb up to the Rotwandhaus (1,737 m) for a hearty hut lunch, then on to the Rotwand summit (1,884 m) for one of the best panoramas in the Bavarian pre-Alps.",
    link: "https://www.outdooractive.com/en/route/hiking-route/bavarian-pre-alps/rotwandhaus-ascent-from-spitzingsee/10653029/",
  },
  {
    title: "Swim at the Alpenfreibad",
    kind: "Outdoor pool",
    season: "Mid-May–mid-September",
    emoji: "🏊",
    description:
      "Bayrischzell's lovely open-air pool, heated to a gentle 24–26 °C by eco heat pumps. Lanes to swim, a baby pool and slide for the little ones, a diving board, and a sunny bistro terrace.",
    link: "https://www.bayrischzell.de/alpenfreibad",
  },
  {
    title: "Relax at Dorfbad Tannermühl",
    kind: "Rustic day spa",
    season: "Year-round (book ahead)",
    emoji: "♨️",
    description:
      "A 300-year-old former mill turned tiny alpine day spa at the foot of the Wendelstein — old-wood sauna, outdoor tubs beside the waterfall, and a fire-lit rest room. Exclusive group bookings only, so reserve well in advance.",
    link: "https://www.almbad.de/tannermuehl/",
  },
];
