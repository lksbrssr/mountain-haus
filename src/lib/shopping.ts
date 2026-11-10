// The Haus shopping list — things we're planning to buy, or already have.
// Edit freely: flip `status` between "bought" and "planned", tweak prices/notes.

export type ShopStatus = "bought" | "planned";

export type ShopItem = {
  name: string;
  brand: string;
  category: string;
  // Price in EUR. null = unknown / to be decided.
  price: number | null;
  // "VB" (Verhandlungsbasis) or similar qualifier shown after the price.
  priceNote?: string;
  status: ShopStatus;
  image: string;
  blurb: string;
  link: string;
  source: string;
};

export const shoppingItems: ShopItem[] = [
  {
    name: "Rattankorb mit Henkeln",
    brand: "Kobolo · Cane, Gr. L",
    category: "Storage",
    price: 89,
    status: "planned",
    image: "/shopping/basket-round.jpg",
    blurb:
      "Handwoven rattan basket with handles — for blankets by the fire or boots at the door.",
    link: "https://www.otto.de/p/kobolo-aufbewahrungskorb-rattankorb-aufbewahrungskorb-mit-henkeln-cane-gr-l-S08DC0X0/",
    source: "otto.de",
  },
  {
    name: "Umkleidebank mit Hakenleiste",
    brand: "Zweiseitig · Holz & Metall, 239 cm",
    category: "Furniture",
    price: 260,
    priceNote: "VB",
    status: "planned",
    image: "/shopping/bench.jpg",
    blurb:
      "Free-standing double-sided changing bench with a coat rail — perfect for the boot room after a hike.",
    link: "https://www.kleinanzeigen.de/s-anzeige/zweiseitige-umkleidebank-mit-hakenleiste-freistehend-holz-metallgestell-239cm-garderobe-sport-fitness-verein/3335153339-230-19386",
    source: "kleinanzeigen.de",
  },
  {
    name: "Guard M1S8380 Bodenstaubsauger",
    brand: "Miele · 890 W",
    category: "Cleaning",
    price: 209,
    status: "planned",
    image: "/shopping/miele-vacuum-white.webp",
    blurb:
      "Bagged canister vacuum with plenty of suction — the workhorse for a house full of guests.",
    link: "https://www.mediamarkt.de/de/product/_miele-guard-m1s8380-bodenstaubsauger-maximale-leistung-890-watt-2966535.html",
    source: "mediamarkt.de",
  },
  {
    name: "Hardfloor Twister XL (SBB 400-4)",
    brand: "Miele · Hartbodenbürste, 41 cm",
    category: "Cleaning",
    price: 69.9,
    status: "planned",
    image: "/shopping/brush.webp",
    blurb:
      "Extra-wide hard-floor brush for the Miele — gentle on the wood, fast across big rooms.",
    link: "https://www.miele.de/product/13191460/hardfloor-twister-xl-hartbodenbuerste-sbb-400-4",
    source: "miele.de",
  },
  {
    name: "Etagenbett Hoch · Buche",
    brand: "Ehrenkind · Massivholz, 170 cm",
    category: "Furniture",
    price: 569.9,
    status: "planned",
    image: "/shopping/bunkbed.jpg",
    blurb:
      "Solid beech bunk bed that splits into two singles — two more sleeping spots for a houseful of kids.",
    link: "https://www.ehrenkind.de/products/etagenbett-buche-hoch",
    source: "ehrenkind.de",
  },
  {
    name: "Sonos (Black)",
    brand: "Sonos · WLAN & Bluetooth",
    category: "Audio",
    price: 349,
    status: "planned",
    image: "/shopping/sonos.png",
    blurb:
      "A versatile speaker in black — music on the balcony, podcasts in the kitchen, the whole house in sync.",
    link: "https://www.sonos.com/de-at/shop/sonos-play",
    source: "sonos.com",
  },
  {
    name: "Edelstahl Schuhtrockner · 5 Paar",
    brand: "Paroli · Stainless steel (INOX)",
    category: "Boot room",
    price: 916.8,
    status: "planned",
    image: "/shopping/dryer.png",
    blurb:
      "Wall-mounted stainless-steel boot & shoe dryer for five pairs — warm, dry boots after every ski day.",
    link: "https://paroli.info/shop-edelstahl-trockner/",
    source: "paroli.info",
  },
  {
    name: "La Pavoni Professional Lusso",
    brand: "La Pavoni · Lever espresso machine",
    category: "Kitchen",
    price: 749,
    status: "planned",
    image: "/shopping/espresso.jpg",
    blurb:
      "The classic chrome lever espresso machine — a little ceremony with the morning coffee before the mountains.",
    link: "https://www.best-in-espresso.de/Espressomaschine-LAPAVONI-Europiccola-Lusso-Kunststoffgriff-LPLPLQ01EU-Paket1.html",
    source: "best-in-espresso.de",
  },
  {
    name: "Tolomeo Tavolo Schreibtischleuchte",
    brand: "Artemide · Design classic since 1987",
    category: "Lighting",
    price: 304,
    status: "planned",
    image: "/shopping/lamp.jpg",
    blurb:
      "The iconic Artemide desk lamp — aluminium, fully adjustable, a bit of Italian design for the workspace.",
    link: "https://www.connox.de/products/artemide-tolomeo-tavolo-schreibtischleuchte",
    source: "connox.de",
  },
  {
    name: "P2723QE 27″ 4K USB-C Monitor",
    brand: "Dell · 3840×2160 IPS",
    category: "Workspace",
    price: 366.23,
    status: "planned",
    image: "/shopping/dell-monitor.webp",
    blurb:
      "A crisp 4K display with USB-C — for the rainy days when someone has to get a little work done.",
    link: "https://www.mediamarkt.de/de/product/_dell-dell-p2723qe-monitor-27-6847cm-4k-3840-x-2160-ips-5ms-169-hdmi-displayport-usb-c-27-zoll-suhd-4k-635-7366cm-25-29-zoll-5-ms-reaktionszeit-98693323.html",
    source: "mediamarkt.de",
  },
];
