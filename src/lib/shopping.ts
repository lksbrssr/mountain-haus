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
    name: "Spotless Max Cam Saugroboter",
    brand: "Bosch · BCRDW3BX, 11.000 Pa",
    category: "Cleaning",
    price: null,
    status: "planned",
    image: "/shopping/bosch-saugroboter.jpg",
    blurb:
      "Robot vacuum with mopping and a self-cleaning dock — washes and dries its own pads, empties the bin, refills water. Camera navigation and 11.000 Pa suction keep the haus tidy between guests.",
    link: "https://www.bosch-home.com/de/de/product/staubsauger/saugroboter/BCRDW3BX",
    source: "bosch-home.com",
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
    name: "Hüpfsofa Cord · Rosé",
    brand: "Ehrenkind · 2-in-1 play sofa",
    category: "Kids",
    price: 399.9,
    status: "planned",
    image: "/shopping/huepfsofa.jpg",
    blurb:
      "Corduroy play sofa that turns into jumping cushions — endless rainy-day fort-building for the kids.",
    link: "https://www.ehrenkind.de/products/huepfsofa-cord?variant=55017364226424",
    source: "ehrenkind.de",
  },
  {
    name: "Bettschlange",
    brand: "dear april · D14, L175",
    category: "Kids",
    price: 59,
    status: "planned",
    image: "/shopping/bettschlange.jpg",
    blurb:
      "Soft knotted bed bumper — a cosy edge for the kids' beds in the bunk room.",
    link: "https://www.bettenrid.de/dear-april-bettschlange.html?varID=2e96e46b124b91a5ca184e3209942190",
    source: "bettenrid.de",
  },
  {
    name: "Edelstahl Schuhtrockner · 5 Paar",
    brand: "Paroli · Stainless steel (INOX)",
    category: "Boot room",
    price: 916.8,
    status: "planned",
    image: "/shopping/dryer-5pair.png",
    blurb:
      "Wall-mounted stainless-steel boot & shoe dryer for five pairs — warm, dry boots after every ski day.",
    link: "https://paroli.info/shop-edelstahl-trockner/",
    source: "paroli.info",
  },
  {
    name: "Big Green Egg Large Starterset",
    brand: "Big Green Egg · Kamado Keramikgrill",
    category: "Outdoor",
    price: 2399,
    status: "planned",
    image: "/shopping/big-green-egg.jpg",
    blurb:
      "The iconic ceramic kamado grill — smoke, roast or sear for 7–10 people. Starter set with Dual Zone deflector kit and cast-iron grate for long evenings on the terrace.",
    link: "https://www.kamdi24.de/big-green-egg-keramikgrill-large-starterset",
    source: "kamdi24.de",
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
    name: "Spielteppich / Bodenmatratze",
    brand: "Maison du Monde · Hellgrau, 130×65 cm",
    category: "Kids",
    price: 17,
    status: "planned",
    image: "/shopping/spielteppich-matratze.jpg",
    blurb:
      "Tufted light-grey floor mattress — a soft landing spot for reading or play in the kids' room. Very good condition, pickup in München.",
    link: "https://www.kleinanzeigen.de/s-anzeige/maison-du-monde-spielteppich-bodenmatratze/3565270755-20-6426",
    source: "kleinanzeigen.de",
  },
  {
    name: "Miso Vorleger",
    brand: "Evelyn Kahle · 100% Baumwolle",
    category: "Textiles",
    price: null,
    status: "planned",
    image: "/shopping/miso-vorleger.jpg",
    blurb:
      "Chunky knitted cotton rug — soft underfoot by the bed or bath. Comes in white, silver, ecru or revolver; sizes from 45×56 up to 100×200 cm.",
    link: "https://www.evelyn-kahle.de/page/1630.htm",
    source: "evelyn-kahle.de",
  },
  {
    name: "LST2 Tischleuchte",
    brand: "WOKA Lamps Vienna · Adolf Loos zugeschrieben",
    category: "Lighting",
    price: 5150,
    status: "planned",
    image: "/shopping/woka-loos-lamp.jpg",
    blurb:
      "Table lamp with opal glass dome on a nickel base — a reissue of a design attributed to Adolf Loos for the Villa Steiner. A quiet piece of Viennese modernism for the haus.",
    link: "https://www.woka.com/de/katalog/lst2-24/",
    source: "woka.com",
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
    image: "/shopping/dell-monitor.jpg",
    blurb:
      "A crisp 4K display with USB-C — for the rainy days when someone has to get a little work done.",
    link: "https://www.mediamarkt.de/de/product/_dell-dell-p2723qe-monitor-27-6847cm-4k-3840-x-2160-ips-5ms-169-hdmi-displayport-usb-c-27-zoll-suhd-4k-635-7366cm-25-29-zoll-5-ms-reaktionszeit-98693323.html",
    source: "mediamarkt.de",
  },
];
