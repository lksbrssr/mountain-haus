// The outside of the house, traced from the floor plans (EG, OG, DG, 1:50) and
// the 1996 permit plan (elevations + section). Everything is in metres.
//
// Plan coordinates: x runs east, y runs north. (0, 0) is the south-west corner
// of the main body, which is 10.99 m wide (x) and 8.99 m deep (y). The dining
// bay ("Essen" block) sticks out 1.50 m to the west and 1.50 m to the south.
// Heights are measured from the ground-floor floor level (±0.00).
//
// To fix a wall, window or door, change the numbers here. The 3D scene is
// generated from this file.

export const LEVEL = { ground: -0.15, eg: 0, og: 2.68, dg: 5.33 };

export const ROOF = {
  pitch: (21 * Math.PI) / 180, // 21° per the section
  // The permit plan says 8.30. As built the roof sits about 0.5 m higher (measured off the
  // street-side photo; it also matches the 1.50 m knee wall drawn in the attic plan).
  ridge: 8.8,
  ridgeY: 4.495, // the ridge runs east–west over the middle of the main body
  xMin: -1.85, // gable overhangs: 1.85 m beyond the main walls
  xMax: 12.84,
  yMin: -1.8, // eave overhangs: 1.80 m beyond the main walls
  yMax: 10.79,
  thick: 0.22,
};

export const WALL_T = 0.3;
export const CLAD_T = 0.04;

export type Opening = {
  kind: "window" | "door" | "garage";
  /** Range along the wall, in plan coordinates (x for east–west walls, y for north–south walls). */
  a: number;
  b: number;
  /** Bottom edge, absolute height. */
  sill: number;
  h: number;
  /** true = round arch; a number = a shallow arch that rises this many metres. */
  arch?: boolean | number;
  /** Doors only: the door sits in a niche this deep; a/b is where the door leaf is. */
  recess?: {
    depth: number;
    a: number;
    b: number;
    /** The wall beside the door runs at an angle from the door out to the face of the house. */
    splay?: boolean;
    /** A small window in that angled wall: position along it (0 = at the door, 1 = at the house face). */
    window?: { at: number; sill: number; w: number; h: number };
  };
  shutters?: boolean;
  /** Doors only: glass door (balcony, terrace) instead of a solid leaf. */
  glazed?: boolean;
  /** Doors only: makes the door clickable. */
  id?: string;
  /** Doors only: the floor height a visitor stands on in front of it. */
  stand?: number;
  /** Doors only: how far in front of the door the visitor stands. */
  out?: number;
};

/** A timber-clad area on a wall. Without a/b it spans the whole wall; without z1 it runs up to the roof. */
export type Clad = { a?: number; b?: number; z0: number; z1?: number };

export type Wall = {
  id: string;
  from: [number, number];
  to: [number, number];
  openings: Opening[];
  clad: Clad[];
};

const OG_HIGH = 3.29;
const BASE = LEVEL.ground - 0.05;
const UPPER = LEVEL.og - 0.06; // timber from the upper floor upwards
const GABLE = LEVEL.dg - 0.05; // timber in the gable only

const win = (
  a: number,
  b: number,
  floor: number,
  sill: number,
  h: number,
  extra: Partial<Opening> = {},
): Opening => ({ kind: "window", a, b, sill: floor + sill, h, ...extra });

const groundDoor = (
  id: string,
  a: number,
  b: number,
  h: number,
  extra: Partial<Opening> = {},
): Opening => ({ kind: "door", id, a, b, sill: LEVEL.eg, h, stand: LEVEL.ground, out: 2.8, ...extra });

const balconyDoor = (id: string, a: number, b: number, floor: number, h: number): Opening => ({
  kind: "door",
  id,
  a,
  b,
  sill: floor + 0.02,
  h,
  glazed: true,
  stand: floor - 0.03,
  out: 0.75,
});

// Outline of the house, counter-clockwise, starting at the dining bay.
export const walls: Wall[] = [
  {
    id: "bay-south",
    from: [-1.5, -1.5],
    to: [1.865, -1.5],
    clad: [{ z0: UPPER }],
    openings: [
      win(-0.26, 0.625, LEVEL.eg, 0.9, 0.885, { shutters: true }),
      win(-0.26, 0.625, LEVEL.og, 0.9, 0.885, { shutters: true }),
    ],
  },
  {
    id: "bay-east",
    from: [1.865, -1.5],
    to: [1.865, 0],
    clad: [{ z0: UPPER }],
    openings: [win(-0.95, -0.565, LEVEL.eg, 1.2, 0.5)],
  },
  {
    id: "south",
    from: [1.865, 0],
    to: [10.99, 0],
    clad: [{ b: 7.4, z0: BASE, z1: UPPER }, { a: 7.4, z0: BASE }],
    openings: [
      groundDoor("terrace", 2.365, 5.0, 2.125, { glazed: true }),
      win(6.115, 7.125, LEVEL.eg, 0.9, 1.0),
      groundDoor("studio", 8.24, 9.25, 2.125, { glazed: true }),
      balconyDoor("south-balcony-west", 2.865, 4.375, LEVEL.og, 2.1),
      balconyDoor("south-balcony-east", 6.115, 7.125, LEVEL.og, 2.1),
      win(7.74, 9.25, LEVEL.og, 0.9, 1.0),
    ],
  },
  {
    id: "east",
    from: [10.99, 0],
    to: [10.99, 8.99],
    clad: [{ z0: BASE }],
    openings: [
      win(6.065, 6.7, LEVEL.eg, 1.9, 0.635),
      win(4.565, 5.2, LEVEL.eg, 1.9, 0.635),
      balconyDoor("east-balcony", 6.19, 7.2, OG_HIGH, 2.0),
      win(3.9, 4.91, LEVEL.og, 0.9, 1.01),
      balconyDoor("attic-east-north", 4.615, 5.6, LEVEL.dg, 2.0),
      balconyDoor("attic-east-south", 3.39, 4.375, LEVEL.dg, 2.0),
      win(5.84, 6.6, LEVEL.dg, 0.75, 0.76),
      win(2.39, 3.15, LEVEL.dg, 0.75, 0.76),
    ],
  },
  {
    id: "north",
    from: [10.99, 8.99],
    to: [0, 8.99],
    // Positions on this wall are measured off the street-side photo.
    clad: [{ a: 7.62, z0: BASE }],
    openings: [
      { kind: "garage", a: 7.99, b: 10.625, sill: 0.85, h: 2.1 },
      win(6.43, 7.17, LEVEL.eg, 1.09, 0.91, { arch: 0.12 }),
      groundDoor("front", 4.24, 5.99, 2.41, { arch: 0.3, recess: {
          depth: 0.7,
          a: 4.97,
          b: 5.92,
          splay: true,
          // Measured off the street-side photo: overall about 0.40 m wide and 0.51 m high,
          // its top 0.3 m below the top of the door.
          window: { at: 0.45, sill: 1.27, w: 0.3, h: 0.41 },
        },
      }),
      win(2.19, 2.53, LEVEL.eg, 0.87, 0.39),
      balconyDoor("north-balcony", 0.78, 1.75, LEVEL.og, 2.4),
      win(4.25, 4.85, LEVEL.og, 1.4, 0.6),
      // The room over the garage sits higher (floor at +3.29), and so do its windows.
      win(6.04, 7.18, OG_HIGH, 1.09, 0.89, { shutters: true }),
      win(8.76, 9.885, OG_HIGH, 1.09, 0.89, { shutters: true }),
    ],
  },
  {
    id: "west",
    from: [0, 8.99],
    to: [0, 2.365],
    clad: [{ z0: GABLE }],
    openings: [
      win(6.99, 7.75, LEVEL.eg, 1.14, 0.76),
      groundDoor("kitchen", 5.99, 6.75, 2.0),
      win(4.99, 5.75, LEVEL.eg, 1.14, 0.76),
      win(2.865, 3.875, LEVEL.eg, 0.9, 1.0, { shutters: true }),
      balconyDoor("west-balcony-north", 6.99, 8.0, LEVEL.og, 2.1),
      balconyDoor("west-balcony-south", 5.115, 6.125, LEVEL.og, 2.1),
      win(2.865, 3.625, LEVEL.og, 1.14, 0.76),
      balconyDoor("attic-west-north", 4.615, 5.5, LEVEL.dg, 2.0),
      balconyDoor("attic-west-south", 3.49, 4.375, LEVEL.dg, 2.0),
      win(5.84, 6.6, LEVEL.dg, 0.75, 0.76),
      win(2.5, 3.26, LEVEL.dg, 0.75, 0.76),
    ],
  },
  {
    id: "bay-north",
    from: [0, 2.365],
    to: [-1.5, 2.365],
    clad: [{ z0: UPPER }],
    openings: [],
  },
  {
    id: "bay-west",
    from: [-1.5, 2.365],
    to: [-1.5, -1.5],
    clad: [{ z0: UPPER }],
    openings: [
      win(-0.01, 0.875, LEVEL.eg, 0.9, 0.885, { shutters: true }),
      win(-0.01, 0.875, LEVEL.og, 0.9, 0.885, { shutters: true }),
    ],
  },
];

/**
 * Which bookable room sits behind a clickable door. Only doors listed here get a
 * marker in the 3D view; hovering shows the room's photos, clicking opens its page.
 * (Keyed by the door `id` in `walls`; the numbers are the markers' old labels.)
 */
export const doorRooms: Record<string, string> = {
  studio: "the-studio", // 2
  "south-balcony-west": "luxury", // 3
  "south-balcony-east": "mountain-view", // 4
  "east-balcony": "kids-paradise", // 5
  "attic-west-north": "attic", // 13 (one marker for the attic)
};

type Pt = [number, number];
type Edge = [Pt, Pt];

export type Balcony = {
  id: string;
  /** x0, y0, x1, y1 */
  rect: [number, number, number, number];
  /** Top of the deck. */
  top: number;
  /** Edges with a boarded railing. */
  rails: Edge[];
  /** Edges boarded all the way up to the roof. */
  screens: Edge[];
  /** Edges with a band of boards hanging down from the roof. */
  aprons?: Edge[];
  /** Posts from the deck up to the roof. */
  posts: Pt[];
  /** Posts also run down to the ground. */
  grounded?: boolean;
};

const OG_DECK = LEVEL.og - 0.03;
const DG_DECK = LEVEL.dg - 0.03;

export const balconies: Balcony[] = [
  {
    id: "west",
    rect: [-1.5, 2.365, 0, 9.99],
    top: OG_DECK,
    rails: [
      [[-1.5, 2.365], [-1.5, 9.99]],
      [[-1.5, 9.99], [0, 9.99]],
    ],
    screens: [],
    posts: [[-1.44, 9.93], [-1.44, 6.2]],
  },
  {
    id: "north",
    rect: [0, 8.99, 3.0, 9.99],
    top: OG_DECK,
    rails: [[[0, 9.99], [1.9, 9.99]]],
    aprons: [[[-1.5, 9.99], [1.9, 9.99]]],
    screens: [
      [[1.9, 9.99], [3.0, 9.99]],
      [[3.0, 9.99], [3.0, 8.99]],
    ],
    posts: [[1.9, 9.93]],
  },
  {
    id: "south",
    rect: [1.865, -1.3, 7.4, 0],
    top: OG_DECK,
    rails: [
      [[1.865, -1.3], [7.4, -1.3]],
      [[7.4, -1.3], [7.4, 0]],
    ],
    screens: [],
    aprons: [[[1.865, -1.3], [7.4, -1.3]]],
    posts: [[1.93, -1.24], [4.4, -1.24], [7.34, -1.24]],
  },
  {
    id: "east",
    rect: [10.99, 0, 12.19, 8.99],
    top: OG_HIGH - 0.03, // this balcony belongs to the higher room over the garage
    rails: [
      [[12.19, 0], [12.19, 8.99]],
      [[10.99, 0], [12.19, 0]],
    ],
    screens: [[[10.99, 8.99], [12.19, 8.99]]],
    posts: [[12.13, 0.06], [12.13, 4.495], [12.13, 8.93]],
  },
  {
    id: "attic-west",
    rect: [-1.2, 2.9, 0, 6.1],
    top: DG_DECK,
    rails: [
      [[-1.2, 2.9], [-1.2, 6.1]],
      [[-1.2, 6.1], [0, 6.1]],
      [[-1.2, 2.9], [0, 2.9]],
    ],
    screens: [],
    posts: [],
  },
  {
    id: "attic-east",
    rect: [10.99, 2.9, 11.99, 6.1],
    top: DG_DECK,
    rails: [
      [[11.99, 2.9], [11.99, 6.1]],
      [[10.99, 6.1], [11.99, 6.1]],
      [[10.99, 2.9], [11.99, 2.9]],
    ],
    screens: [],
    posts: [],
  },
];

export const chimney = { x: 2.45, y: 4.2, w: 0.8, d: 0.6, top: 9.7 };

/**
 * Outline of the paved area, in plan coordinates. It runs from the entrance along the street
 * side, round the north-west corner, down the west side, round the dining bay and into the
 * garden terrace. The inner edge follows the house walls.
 */
export const paving: Pt[] = [
  [6.2, 8.99], // street side, at the foot of the steps
  [6.2, 10.5], // 1.5 m deep in front of the entrance
  [-2.7, 10.5], // north-west corner
  [-2.7, -2.7], // south-west corner, past the dining bay
  [1.865, -2.7],
  [1.865, -3.4], // garden terrace
  [8.2, -3.4],
  [8.2, 0],
  [1.865, 0], // back along the walls
  [1.865, -1.5],
  [-1.5, -1.5],
  [-1.5, 2.365],
  [0, 2.365],
  [0, 8.99],
];

/**
 * Steps from the garage drive down to the paving in front of the entrance. They run west
 * along the street-side wall, under the hall window. Position and slope are read off the
 * handrail in the street-side photo, which is fixed to the wall above them.
 */
export const entranceSteps = {
  xTop: 7.7, // where the drive ends
  top: 0.85, // height of the drive at the wall
  bottom: LEVEL.ground + 0.03, // top of the paving
  count: 5, // treads between drive and paving
  tread: 0.3,
  width: 1.1, // out from the wall
  /** Handrail on the wall: plan x and height at its upper and lower end. */
  rail: { from: [7.6, 1.84], to: [6.0, 0.98] },
};

/**
 * The ground is not flat. Around the entrance, the west side and the garden it sits at
 * -0.15. Towards the garage side it rises to the level of the drive (+0.85 at the garage
 * door), so the drive lies in the slope rather than on top of flat ground. Along the east
 * wall it falls back to garden level towards the south, and north of the house the drive
 * and the ground beside it fall gently towards the street.
 */
export const drive = {
  x0: 7.7,
  x1: 10.99,
  top: 0.85, // at the garage door
  fall: 0.05, // metres of height lost per metre going north
  length: 10,
};

/**
 * A paved walkway that slopes down from the side of the drive to the entrance. It leaves the
 * drive a few metres out from the garage, where the drive is lower, and is level from side
 * to side. The ground next to it is graded to meet it.
 */
export const walkway = {
  from: [8.55, 16.65] as Pt, // well onto the drive, so its whole width starts on paving
  to: [5.15, 10.15] as Pt, // on the paving in front of the door
  width: 1.1,
};

const walkLine = () => {
  const [ax, ay] = walkway.from;
  const [bx, by] = walkway.to;
  const len = Math.hypot(bx - ax, by - ay);
  return { ax, ay, len, ux: (bx - ax) / len, uy: (by - ay) / len };
};

/** Height of the walkway, `s` metres along it from the drive end. */
export function walkwayHeight(s: number): number {
  const { ax, ay, ux, uy } = walkLine();
  const onDrive = (v: number) => drive.top - drive.fall * (ay + uy * v - 8.99);
  const leavesDrive = (drive.x0 + 0.05 - ax) / ux;
  const reachesPaving = (10.5 - ay) / uy;
  if (s <= leavesDrive) return onDrive(s);
  const k = Math.min(1, (s - leavesDrive) / (reachesPaving - leavesDrive));
  return onDrive(leavesDrive) + (LEVEL.ground - onDrive(leavesDrive)) * k;
}

const smooth = (a: number, b: number, v: number) => {
  const u = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** Ground height at a plan position. */
export function terrainHeight(x: number, y: number): number {
  const g = LEVEL.ground;
  // Height of the high ground on the garage side.
  const high =
    y >= 8.99
      ? Math.max(g, drive.top - drive.fall * (y - 8.99))
      : g + (drive.top - g) * smooth(0.5, 8.0, y);
  // How much of that height applies here, going east: nothing west of the steps, a bank
  // that stays just under the steps, then the full height from the edge of the drive.
  const foot = entranceSteps.xTop - entranceSteps.count * entranceSteps.tread - 0.05;
  const under = 1 - 1 / (entranceSteps.count + 1) - 0.01;
  let beside: number;
  if (x <= foot) beside = 0;
  else if (x < drive.x0) beside = ((x - foot) / (drive.x0 - foot)) * under;
  else if (x < drive.x0 + 0.05) beside = under + ((x - drive.x0) / 0.05) * (1 - under);
  else beside = 1;
  // Further out from the house the bank is an even, gentle slope, which the walkway runs down.
  const gentle = Math.min(1, Math.max(0, (x - 5.6) / (drive.x0 - 5.6)));
  const out = smooth(10.5, 11.3, y);
  let t = beside * (1 - out) + gentle * out;
  // Far to the east the ground settles back to garden level.
  t *= 1 - smooth(18, 32, x);
  let h = g + (high - g) * t;
  // Beside the walkway the ground is graded to the walkway's height.
  if (x < drive.x0 + 0.05) {
    const { ax, ay, len, ux, uy } = walkLine();
    const s = Math.min(len, Math.max(0, (x - ax) * ux + (y - ay) * uy));
    const dist = Math.hypot(x - (ax + ux * s), y - (ay + uy * s));
    const keep = smooth(walkway.width / 2 + 0.25, walkway.width / 2 + 1.5, dist);
    const wh = walkwayHeight(s);
    h = wh + (h - wh) * keep;
  }
  return h;
}
