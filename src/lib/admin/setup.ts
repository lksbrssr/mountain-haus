// Move-in / change-of-owner to-dos for a house in Bayrischzell (Miesbach
// district, Bavaria). These are the one-time registrations you work through
// after a change of ownership. Flip `done` to true as you knock them out.
// Not legal advice — confirm specifics with the Gemeinde / your notary.

export type SetupPriority = "now" | "soon" | "later";

export type SetupTask = {
  id: string;
  title: string;
  priority: SetupPriority;
  where: string; // who to contact / where to do it
  done: boolean;
  detail: string;
};

export const setupTasks: SetupTask[] = [
  {
    id: "strom",
    title: "Register electricity (change of owner)",
    priority: "now",
    where: "Electricity provider / default supplier, Miesbach district",
    done: false,
    detail:
      "Notify the provider with the meter reading (4,434 kWh) and meter number (1645 774 X 4717 0129). Either take over the existing contract or pick a new supplier — otherwise you default to the local basic supplier (Grundversorger). Do this within ~2 weeks.",
  },
  {
    id: "wasser",
    title: "Transfer water & sewage",
    priority: "now",
    where: "Gemeinde Bayrischzell / water utility",
    done: false,
    detail:
      "Report the change of owner to the municipal water and sewage service. Note the water meter reading yourself (it wasn't captured in the handover protocol). Future bills go to the new owner.",
  },
  {
    id: "muell",
    title: "Register refuse collection & fees",
    priority: "now",
    where: "Miesbach district waste authority (Kommunalunternehmen / KU)",
    done: false,
    detail:
      "Transfer the residual, bio, paper and recycling bins to the new owner and confirm bin sizes / collection schedule. Waste fees run through the district. Sort out recycling-centre (Wertstoffhof) access — local contact: Mr Lill, 0174 7056688.",
  },
  {
    id: "schornsteinfeger",
    title: "Notify the chimney sweep (Schornsteinfeger)",
    priority: "now",
    where: "District chimney sweep Ralf Krieglmeier · 08666 228057 / 0176 20236576",
    done: false,
    detail:
      "Register the change of owner with the district chimney sweep (Kehrbezirk). Mandatory: fireplace inspection (Feuerstättenschau) and recurring flue-gas measurement/sweeping for the boiler (Brötje) and any wood stove. He keeps the logbook and sets the dates.",
  },
  {
    id: "fluessiggas",
    title: "Set up an LPG delivery account",
    priority: "now",
    where: "Gloria-Gas (089 87181111) or H+H Flüssiggas (0821 2678926)",
    done: false,
    detail:
      "The tank is owned (proof of ownership: SANO-Propan invoice, 1997) — no rental, free choice of supplier. Open an account in the new owner's name and register the statutory tank inspections (external 2026, internal 2030) there.",
  },
  {
    id: "grundsteuer",
    title: "Transfer property tax (Grundsteuer)",
    priority: "soon",
    where: "Tax office Miesbach / Gemeinde Bayrischzell",
    done: false,
    detail:
      "After the land-registry entry, property tax passes to the new owner. Check the Gemeinde's property-tax assessment; file a Grundsteuer declaration with the tax office if anything changes.",
  },
  {
    id: "gebaeudeversicherung",
    title: "Sort out buildings insurance",
    priority: "soon",
    where: "Your own insurer / the previous policy",
    done: false,
    detail:
      "The existing buildings insurance passes to the buyer by law (§ 95 VVG). Special right of cancellation within 1 month of the land-registry entry — take out your own policy including natural-hazard cover (flood/avalanche/heavy rain — important in an alpine location). Add contents insurance too.",
  },
  {
    id: "rundfunk",
    title: "Sort out the broadcasting fee (Rundfunkbeitrag)",
    priority: "soon",
    where: "rundfunkbeitrag.de",
    done: false,
    detail:
      "As a second home you may be exempt if your main residence (Munich) already pays — apply for the second-home exemption. Otherwise register the dwelling.",
  },
  {
    id: "zweitwohnsitz",
    title: "Check second-residence registration & tax",
    priority: "soon",
    where: "Gemeinde Bayrischzell (residents' office)",
    done: false,
    detail:
      "If used as a second home: register at the residents' office. Check whether Bayrischzell levies a second-home tax (Zweitwohnungsteuer) — likely, given it's a tourist town.",
  },
  {
    id: "kurbeitrag",
    title: "Check the spa/visitor levy (Kurbeitrag)",
    priority: "later",
    where: "Spa administration / tourist office, Bayrischzell",
    done: false,
    detail:
      "Bayrischzell is a designated spa town. Second-home owners may owe a spa/visitor levy — it usually comes with the GästeCard (cable-car / public-transport perks). Register with the spa administration.",
  },
  {
    id: "internet",
    title: "Set up internet / phone",
    priority: "later",
    where: "Telekom / regional provider",
    done: false,
    detail:
      "Check availability at the address and order a connection. Rural location — bandwidth may be limited, so weigh alternatives (cable/fixed-wireless/Starlink).",
  },
  {
    id: "wifi",
    title: "Add WiFi details to the guest area",
    priority: "later",
    where: "src/lib/info.ts",
    done: false,
    detail:
      "Once the connection is live: update the WiFi name and password in info.ts so the guest area is correct.",
  },
];

export const priorityLabel: Record<SetupPriority, string> = {
  now: "First",
  soon: "Soon",
  later: "Later",
};
