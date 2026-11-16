import * as THREE from "three";
import {
  buildTree,
  grassTufts,
  groundShade,
  imageMean,
  loadSky,
  patchyLawn,
  shadeUv,
  spruceBelt,
  type Ground,
  type GroundPhotos,
  type Sky,
} from "./landscape";
import {
  balconies,
  chimney,
  doorRooms,
  drive,
  entranceSteps,
  paving,
  streetBalcony,
  CLAD_T,
  LEVEL,
  ROOF,
  terrainHeight,
  walkway,
  walkwayHeight,
  WALL_T,
  walls,
  type Opening,
  type Wall,
} from "@/lib/house3d";

export type ViewMode = "orbit" | "door";
export type SceneHandle = {
  back: () => void;
  /** Leave the photo's viewpoint for the free view, over `ms` milliseconds. */
  reveal: (ms?: number) => void;
  /** Scroll-driven use: 0 = the photo's viewpoint, 1 = the free view that can be dragged. */
  setProgress: (p: number) => void;
  /** Pause drawing while the scene is off screen or still covered by the photo. */
  setActive: (on: boolean) => void;
  /**
   * Clean view (off, the default): the house and its garden in a plain, neutral space.
   * On: the camera pulls back and the real surroundings blend in (backdrop, aerial photo
   * on the ground, trees).
   */
  setSurroundings: (on: boolean) => void;
  ready: Promise<void>;
  dispose: () => void;
};

// ---------------------------------------------------------------------------
// Plan → scene coordinates. Plan x = east, plan y = north, z = up.
// In the scene, x = east, y = up and north points towards -z.
// ---------------------------------------------------------------------------
const CX = 5.495;
const CY = 4.495;
const P = (x: number, y: number, z: number) => new THREE.Vector3(x - CX, z, -(y - CY));

const TAN = Math.tan(ROOF.pitch);
const roofTop = (y: number) => ROOF.ridge - Math.abs(y - ROOF.ridgeY) * TAN;
const roofUnder = (y: number) => roofTop(y) - 0.2;

const COLOR = {
  sky: "#f6f1e7",

  ground: "#e4e6d6",
  stone: "#d3cdbf",
  plaster: "#f4f0e7",
  timber: "#c9976a",
  timberDark: "#9c6b45",
  door: "#96673f",
  frame: "#a57648",
  glass: "#3a474e",
  shutter: "#8794a3",
  roof: "#a8705a",
  tree: "#7d927a",
  trunk: "#8a6f58",
};

const EYE = 1.65;
const FOV_ORBIT = 32;
const FOV_DOOR = 68;

type Door = {
  id: string;
  room: string;
  eye: THREE.Vector3;
  look: THREE.Vector3;
  hit: THREE.Mesh;
  dot: THREE.Sprite;
};

// ---------------------------------------------------------------------------
// Textures drawn in code. They stand in until real surfaces are generated.
// ---------------------------------------------------------------------------
function shade(hex: string, k: number) {
  const c = new THREE.Color(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255 * k)));
  return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
}

function finish(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Vertical boards. One tile is 1 m wide and holds eight boards. */
function boardsTexture(base: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 32;
  const g = c.getContext("2d")!;
  const n = 8;
  const w = c.width / n;
  const tint = [1.0, 0.95, 1.03, 0.97, 1.01, 0.93, 0.99, 1.04];
  for (let i = 0; i < n; i++) {
    g.fillStyle = shade(base, tint[i]);
    g.fillRect(i * w, 0, w, c.height);
    g.fillStyle = shade(base, 0.72);
    g.fillRect(i * w, 0, 3, c.height);
  }
  return finish(c);
}

/** Roof tiles. One tile of the texture is 1.2 m × 1.2 m: four tiles by four rows. */
function tilesTexture(base: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const n = 4;
  const s = c.width / n;
  const tint = [1.0, 0.94, 1.05, 0.97, 1.03, 0.92, 0.99];
  for (let row = 0; row < n; row++) {
    for (let col = -1; col < n; col++) {
      const x = col * s + (row % 2 ? s / 2 : 0);
      g.fillStyle = shade(base, tint[(row * 3 + col + 7) % tint.length]);
      g.fillRect(x, row * s, s, s);
      g.fillStyle = shade(base, 0.74);
      g.fillRect(x, row * s, 2, s);
    }
    g.fillStyle = shade(base, 0.66);
    g.fillRect(0, row * s, c.width, 4);
  }
  return finish(c);
}

/** Soft vertical folds for the curtains. */
function curtainTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 8;
  const g = c.getContext("2d")!;
  for (let x = 0; x < c.width; x++) {
    const fold = 0.5 + 0.5 * Math.cos((x / c.width) * Math.PI * 2 * 9);
    const v = Math.round(255 * (0.8 + 0.2 * fold));
    g.fillStyle = `rgb(${v},${v},${Math.round(v * 0.985)})`;
    g.fillRect(x, 0, 1, c.height);
  }
  return finish(c);
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fillStyle = "rgba(47,62,52,0.22)";
  g.fill();
  g.beginPath();
  g.arc(64, 64, 34, 0, Math.PI * 2);
  g.fillStyle = "#f6f1e7";
  g.fill();
  g.lineWidth = 9;
  g.strokeStyle = "#2f3e34";
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// Surfaces. Each one is an image in public/house3d (generated with FLUX) that
// covers `size` metres and repeats. If an image is missing, the surface falls
// back to a texture drawn in code or to a flat colour.
// ---------------------------------------------------------------------------
type Surface = { map: THREE.Texture | null; size: number; color: string };
type Surfaces = Record<"timber" | "plaster" | "roof" | "paving" | "grass", Surface> & { dispose: () => void };

// Official aerial photos of the surroundings, laid on the ground beyond the garden: the 420 m
// around the house, the village around that, and a sharpened copy of the nearest 100 m. They
// are fetched only when the surroundings are first shown.
const AERIAL_URL = "/house3d/aerial.jpg";
const AERIAL_WIDE_URL = "/house3d/aerial-wide.jpg";
const AERIAL_CLOSE_URL = "/house3d/aerial-close.jpg";

async function loadGroundPhotos(): Promise<GroundPhotos | null> {
  const loader = new THREE.TextureLoader();
  const load = async (url: string) => {
    try {
      const t = await loader.loadAsync(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    } catch {
      return null;
    }
  };
  const [aerial, wide, close] = await Promise.all([load(AERIAL_URL), load(AERIAL_WIDE_URL), load(AERIAL_CLOSE_URL)]);
  if (!aerial) {
    wide?.dispose();
    close?.dispose();
    return null;
  }
  return { aerial, wide, close };
}

const SURFACE_FILES = {
  timber: { url: "/house3d/timber.jpg", size: 2.1 },
  plaster: { url: "/house3d/plaster.jpg", size: 2.4 },
  roof: { url: "/house3d/roof.jpg", size: 5.0 },
  paving: { url: "/house3d/paving.jpg", size: 4.5 },
  grass: { url: "/house3d/grass.jpg", size: 3.0 },
} as const;
/**
 * Warm the browser cache with the house's surface images so the pop-out can build the
 * model the instant it opens instead of waiting on five cold fetches. Safe to call often.
 */
export function preloadHouseTextures() {
  if (typeof window === "undefined") return;
  for (const key of Object.keys(SURFACE_FILES) as (keyof typeof SURFACE_FILES)[]) {
    const img = new Image();
    img.src = SURFACE_FILES[key].url;
  }
}

// The paving image is lightened in code, because the real stones are a lighter grey than the
// generated ones. (The lawn used to be lightened too, for a calmer look; it now keeps its colour.)
const WASH: Partial<Record<keyof typeof SURFACE_FILES, { color: string; amount: number }>> = {
  paving: { color: "#e9eaee", amount: 0.32 },
};
// The real cladding is a little redder than the generated boards.
const TIMBER_TINT = "#ffe7db";

async function loadSurfaces(): Promise<Surfaces> {
  const loader = new THREE.TextureLoader();
  const load = async (key: keyof typeof SURFACE_FILES): Promise<THREE.Texture | null> => {
    try {
      let t: THREE.Texture = await loader.loadAsync(SURFACE_FILES[key].url);
      const wash = WASH[key];
      if (wash) {
        const img = t.image as HTMLImageElement;
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0);
        g.globalAlpha = wash.amount;
        g.fillStyle = wash.color;
        g.fillRect(0, 0, c.width, c.height);
        t.dispose();
        t = new THREE.CanvasTexture(c);
      }
      // Mirrored repeat hides the seams of an image that does not tile perfectly.
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
      // Roof tiles overlap downhill, so they must not be mirrored top to bottom.
      if (key === "roof") t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    } catch {
      return null;
    }
  };
  const [timber, plaster, roof, paving, grass] = await Promise.all([
    load("timber"),
    load("plaster"),
    load("roof"),
    load("paving"),
    load("grass"),
  ]);
  const made: THREE.Texture[] = [];
  const drawn = (t: THREE.Texture) => {
    made.push(t);
    return t;
  };
  const all = [timber, plaster, roof, paving, grass];
  return {
    timber: timber
      ? { map: timber, size: SURFACE_FILES.timber.size, color: TIMBER_TINT }
      : { map: drawn(boardsTexture(COLOR.timber)), size: 1, color: "#ffffff" },
    plaster: { map: plaster, size: SURFACE_FILES.plaster.size, color: plaster ? "#ffffff" : COLOR.plaster },
    roof: roof
      ? { map: roof, size: SURFACE_FILES.roof.size, color: "#ffffff" }
      : { map: drawn(tilesTexture(COLOR.roof)), size: 1.2, color: "#ffffff" },
    paving: { map: paving, size: SURFACE_FILES.paving.size, color: paving ? "#ffffff" : COLOR.stone },
    grass: { map: grass, size: SURFACE_FILES.grass.size, color: grass ? "#ffffff" : COLOR.ground },
    dispose: () => [...all, ...made].forEach((t) => t?.dispose()),
  };
}

// ---------------------------------------------------------------------------
// House
// ---------------------------------------------------------------------------
function buildHouse(surf: Surfaces, small: boolean) {
  const group = new THREE.Group();
  let tufts: THREE.InstancedMesh | null = null;
  let clearForest: ((camera: THREE.Vector3) => void) | null = null;
  let ground: Ground | null = null;
  // Trees and the forest edge: part of the surroundings, hidden in the clean view.
  const around: THREE.Object3D[] = [];
  const doors: Door[] = [];
  const disposables: { dispose: () => void }[] = [];

  const std = (p: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...p });
    disposables.push(m);
    return m;
  };
  // A surface on geometry whose texture coordinates are 0..1 across a face of w × h metres.
  const fittedCache = new Map<string, THREE.MeshStandardMaterial>();
  const fitted = (name: keyof typeof SURFACE_FILES, w: number, h: number, tint?: string, flip = false) => {
    const sf = surf[name];
    const key = `${name}:${w.toFixed(2)}x${h.toFixed(2)}:${tint ?? ""}:${flip}`;
    let m = fittedCache.get(key);
    if (!m) {
      let map: THREE.Texture | undefined;
      if (sf.map) {
        map = sf.map.clone();
        map.repeat.set(w / sf.size, ((flip ? -1 : 1) * h) / sf.size);
        map.needsUpdate = true;
        disposables.push(map);
      }
      m = std({ map, color: tint ?? sf.color });
      fittedCache.set(key, m);
    }
    return m;
  };
  // A surface on extruded geometry, whose texture coordinates are already in metres.
  const metres = (name: keyof typeof SURFACE_FILES, tint?: string) => fitted(name, 1, 1, tint);

  const mat = {
    plaster: metres("plaster"),
    plasterPlain: std({ color: COLOR.plaster }),
    timber: metres("timber"),
    timberPlain: std({ color: COLOR.timberDark }),
    door: std({ color: COLOR.door }),
    frame: std({ color: COLOR.frame }),
    // Window panes: partly see-through, and they mirror the sky and the landscape around.
    // The mirror is stronger than on real glass, which only shows a few percent head-on:
    // at this size a faint reflection reads as a black hole.
    glass: std({
      color: "#74858c",
      roughness: 0.04,
      metalness: 1,
      transparent: true,
      opacity: 0.58,
      envMapIntensity: 1.25,
    }),
    glassSolid: std({ color: COLOR.glass, roughness: 0.08, metalness: 0.1 }),
    // What is behind a pane: a dark room, and a light curtain across the lower part of a window.
    room: std({ color: "#1a1d1e", roughness: 1, side: THREE.BackSide, envMapIntensity: 0.25 }),
    curtain: std({ color: "#f4f2ec", roughness: 1, side: THREE.DoubleSide, map: curtainTexture() }),
    shutter: std({ color: COLOR.shutter }),
    stone: metres("paving"),
    garage: metres("timber", "#d9cdc2"),
  };
  if (mat.curtain.map) disposables.push(mat.curtain.map);
  const boxTimber = (w: number, h: number) => fitted("timber", w, h);

  const add = (mesh: THREE.Object3D, parent: THREE.Object3D = group) => {
    mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        disposables.push(o.geometry);
      }
    });
    parent.add(mesh);
    return mesh;
  };

  /** A box between two plan points, from height z0 to z1. */
  const boxBetween = (
    a: [number, number],
    b: [number, number],
    z0: number,
    z1: number,
    thick: number,
    material: THREE.Material,
  ) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, z1 - z0, thick), material);
    m.position.copy(P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2));
    m.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    return add(m);
  };

  /** An axis-aligned box given by its plan rectangle and height range. */
  const slab = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    z0: number,
    z1: number,
    material: THREE.Material,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), material);
    m.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    return add(m);
  };

  // -- Walls ----------------------------------------------------------------
  const outline = (
    path: THREE.Path,
    u0: number,
    u1: number,
    z0: number,
    z1: number,
    arch: boolean | number | undefined,
  ) => {
    if (typeof arch === "number") {
      // shallow arch: the sides stop `arch` metres below the top
      path.moveTo(u0, z0);
      path.lineTo(u1, z0);
      path.lineTo(u1, z1 - arch);
      path.quadraticCurveTo((u0 + u1) / 2, z1 + arch, u0, z1 - arch);
      path.lineTo(u0, z0);
    } else if (arch) {
      const r = (u1 - u0) / 2;
      path.moveTo(u0, z0);
      path.lineTo(u1, z0);
      path.lineTo(u1, z1 - r);
      path.absarc((u0 + u1) / 2, z1 - r, r, 0, Math.PI, false);
      path.lineTo(u0, z0);
    } else {
      path.moveTo(u0, z0);
      path.lineTo(u1, z0);
      path.lineTo(u1, z1);
      path.lineTo(u0, z1);
      path.lineTo(u0, z0);
    }
    return path;
  };

  const buildWall = (w: Wall) => {
    const [x0, y0] = w.from;
    const [x1, y1] = w.to;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const dx = (x1 - x0) / len;
    const dy = (y1 - y0) / len;
    const alongX = Math.abs(dx) > 0.5;
    const dir = new THREE.Vector3(dx, 0, -dy);
    const normal = new THREE.Vector3(dy, 0, dx); // points outwards
    const origin = P(x0, y0, 0).addScaledVector(normal, -WALL_T);
    const frame = new THREE.Matrix4()
      .makeBasis(dir, new THREE.Vector3(0, 1, 0), normal)
      .setPosition(origin);
    const uOf = (c: number) => (alongX ? (c - x0) * dx : (c - y0) * dy);
    const yAt = (u: number) => y0 + dy * u;

    // Local frame: u along the wall, absolute height, depth from the inside face.
    const open = w.openings.map((o) => {
      const ua = uOf(o.a);
      const ub = uOf(o.b);
      return { o, u0: Math.min(ua, ub), u1: Math.max(ua, ub), z0: o.sill, z1: o.sill + o.h };
    });

    // A shape from height z0 up to the roof (or zCap), between u0 and u1.
    const region = (u0: number, u1: number, z0: number, zCap: number) => {
      const s = new THREE.Shape();
      s.moveTo(u0, z0);
      s.lineTo(u1, z0);
      const us = [u1, u0];
      if (!alongX) {
        const ur = (ROOF.ridgeY - y0) / dy;
        if (ur > u0 && ur < u1) us.splice(1, 0, ur);
        // where the roof line meets the cap height
        for (const sign of [-1, 1]) {
          const yc = ROOF.ridgeY + (sign * (ROOF.ridge - 0.2 - zCap)) / TAN;
          const uc = (yc - y0) / dy;
          if (Number.isFinite(uc) && uc > u0 && uc < u1) us.push(uc);
        }
        us.sort((p, q) => q - p);
      }
      for (const u of us) s.lineTo(u, Math.min(zCap, roofUnder(yAt(u))));
      s.lineTo(u0, z0);
      return s;
    };

    const eps = 0.003;
    const body = region(eps, len - eps, LEVEL.ground - 0.3, Infinity);
    for (const h of open) body.holes.push(outline(new THREE.Path(), h.u0, h.u1, h.z0, h.z1, h.o.arch));
    const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: WALL_T, bevelEnabled: false, curveSegments: 16 });
    bodyGeo.applyMatrix4(frame);
    add(new THREE.Mesh(bodyGeo, mat.plaster));

    const cladded = (h: { u0: number; u1: number; z0: number; z1: number }) =>
      w.clad.some((c) => {
        const [ca, cb] = cladRange(c.a, c.b);
        const mid = (h.u0 + h.u1) / 2;
        const zm = (h.z0 + h.z1) / 2;
        return mid > ca && mid < cb && zm > c.z0 && zm < (c.z1 ?? Infinity);
      });
    function cladRange(a?: number, b?: number): [number, number] {
      const ends = [a === undefined ? null : uOf(a), b === undefined ? null : uOf(b)];
      const known = ends.filter((v): v is number => v !== null);
      // An open end runs to the end of the wall, plus the cladding thickness to close the corner.
      if (known.length === 2) return [Math.min(...known), Math.max(...known)];
      if (known.length === 0) return [-CLAD_T, len + CLAD_T];
      const k = known[0];
      // With one bound given, the region covers the side of the wall that the bound's coordinate opens towards.
      const towardsEnd = a !== undefined ? (alongX ? dx > 0 : dy > 0) : !(alongX ? dx > 0 : dy > 0);
      return towardsEnd ? [k, len + CLAD_T] : [-CLAD_T, k];
    }

    for (const c of w.clad) {
      const [ca, cb] = cladRange(c.a, c.b);
      const s = region(ca, cb, c.z0, c.z1 ?? Infinity);
      for (const h of open) {
        const mid = (h.u0 + h.u1) / 2;
        const zm = (h.z0 + h.z1) / 2;
        if (mid > ca && mid < cb && zm > c.z0 && zm < (c.z1 ?? Infinity)) {
          s.holes.push(outline(new THREE.Path(), h.u0, h.u1, h.z0, h.z1, h.o.arch));
        }
      }
      const geo = new THREE.ExtrudeGeometry(s, { depth: CLAD_T, bevelEnabled: false, curveSegments: 16 });
      geo.translate(0, 0, WALL_T);
      geo.applyMatrix4(frame);
      add(new THREE.Mesh(geo, mat.timber));
    }

    // Windows and doors live in the wall's local frame.
    const local = new THREE.Group();
    local.applyMatrix4(frame);
    group.add(local);

    const place = (geo: THREE.BufferGeometry, material: THREE.Material, depth: number) => {
      const m = new THREE.Mesh(geo, material);
      m.position.z = depth;
      add(m, local);
      return m;
    };
    const bar = (u: number, z: number, bw: number, bh: number, depth: number, material: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), material);
      m.position.set(u, z, depth);
      add(m, local);
    };

    for (const h of open) {
      const { o, u0, u1, z0, z1 } = h;
      const wd = u1 - u0;
      const uc = (u0 + u1) / 2;
      const face = WALL_T + (cladded(h) ? CLAD_T : 0);
      const shape = outline(new THREE.Shape(), u0, u1, z0, z1, o.arch) as THREE.Shape;

      if (o.kind === "garage") {
        place(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }), mat.garage, WALL_T - 0.03);
        const fd = WALL_T + CLAD_T;
        bar(uc, (z0 + z1) / 2, 0.04, z1 - z0, WALL_T + 0.03, mat.timberPlain);
        bar(uc, z1 + 0.04, wd + 0.16, 0.08, fd, mat.timberPlain);
        bar(u0 - 0.04, (z0 + z1) / 2, 0.08, z1 - z0, fd, mat.timberPlain);
        bar(u1 + 0.04, (z0 + z1) / 2, 0.08, z1 - z0, fd, mat.timberPlain);
        continue;
      }

      if (o.kind === "door" && o.recess) {
        // An entrance niche: back wall, two side walls, a lid, and the door leaf at the back.
        const d = o.recess.depth;
        const back = WALL_T - d;
        const panel = (bw: number, bh: number, bd: number, u: number, z: number, depth: number, m: THREE.Material) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m);
          mesh.position.set(u, z, depth);
          add(mesh, local);
        };
        const deep = d - WALL_T; // the part of the niche behind the wall itself
        const mid = back + deep / 2;
        const wallMat = fitted("plaster", wd, o.h);
        panel(wd + 0.1, o.h + 0.1, 0.05, uc, (z0 + z1) / 2, back - 0.025, wallMat);
        panel(0.05, o.h, deep, u0 - 0.025, (z0 + z1) / 2, mid, wallMat);
        panel(0.05, o.h, deep, u1 + 0.025, (z0 + z1) / 2, mid, wallMat);
        panel(wd, 0.05, deep, uc, z1 + 0.025, mid, wallMat);
        // The threshold sits a little above the bottom of the wall opening. At exactly the same
        // height the two surfaces would fight for the same pixels and flicker when the view moves.
        panel(wd, 0.05, d, uc, z0 - 0.025 + 0.015, back + d / 2 - 0.01, fitted("paving", wd, d));
        const la = uOf(o.recess.a);
        const lb = uOf(o.recess.b);
        const leafH = Math.min(o.h - 0.3, 2.1);
        panel(Math.abs(lb - la), leafH, 0.06, (la + lb) / 2, z0 + leafH / 2, back + 0.03, mat.door);
        if (o.recess.splay) {
          // The wall on the wider side of the door runs at an angle, from the door out to the
          // face of the house.
          const lo = Math.min(la, lb);
          const hi = Math.max(la, lb);
          const highSide = u1 - hi >= lo - u0;
          const uFrom = highSide ? hi + 0.03 : lo - 0.03;
          const uTo = highSide ? u1 : u0;
          const du = uTo - uFrom;
          const len = Math.hypot(du, d);
          const front = du > 0 ? 1 : -1; // which face of the angled wall looks out
          const angled = new THREE.Group();
          angled.position.set((uFrom + uTo) / 2, (z0 + z1) / 2, back + d / 2);
          angled.rotation.y = Math.atan2(-d, du);
          local.add(angled);
          add(new THREE.Mesh(new THREE.BoxGeometry(len, o.h, 0.06), fitted("plaster", len, o.h)), angled);
          const win = o.recess.window;
          if (win) {
            const wx = (win.at - 0.5) * len;
            const wy = win.sill + win.h / 2 - (z0 + z1) / 2;
            const frame = new THREE.Mesh(new THREE.BoxGeometry(win.w + 0.1, win.h + 0.1, 0.02), mat.frame);
            frame.position.set(wx, wy, front * 0.035);
            add(frame, angled);
            const glass = new THREE.Mesh(new THREE.BoxGeometry(win.w, win.h, 0.02), mat.glassSolid);
            glass.position.set(wx, wy, front * 0.042);
            add(glass, angled);
          }
        }
      } else if (o.kind === "door" && !o.glazed) {
        place(
          new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 16 }),
          mat.door,
          WALL_T * 0.25,
        );
      } else {
        const pane = place(new THREE.ShapeGeometry(shape, 16), mat.glass, WALL_T * 0.5);
        pane.castShadow = false;
        // A dark room behind the pane, so the view through it stops there and does not run
        // through the empty house.
        const roomDepth = 0.6;
        const room = new THREE.Mesh(new THREE.BoxGeometry(wd + 0.12, o.h + 0.12, roomDepth), mat.room);
        room.position.set(uc, (z0 + z1) / 2, WALL_T * 0.5 - 0.03 - roomDepth / 2);
        add(room, local);
        room.castShadow = false;
        if (o.kind === "window" && wd >= 0.6) {
          // a half-height curtain, as in the photo of the street side
          const ch = o.h * 0.5;
          const curtain = new THREE.Mesh(new THREE.PlaneGeometry(wd - 0.05, ch), mat.curtain);
          curtain.position.set(uc, z0 + 0.03 + ch / 2, WALL_T * 0.5 - 0.07);
          add(curtain, local);
          curtain.castShadow = false;
        }
        const rim = 0.055;
        const ring = outline(new THREE.Shape(), u0, u1, z0, z1, o.arch) as THREE.Shape;
        ring.holes.push(outline(new THREE.Path(), u0 + rim, u1 - rim, z0 + rim, z1 - rim, o.arch));
        place(
          new THREE.ExtrudeGeometry(ring, { depth: 0.07, bevelEnabled: false, curveSegments: 16 }),
          mat.frame,
          WALL_T * 0.5 - 0.02,
        );
        const d = WALL_T * 0.5 + 0.02;
        if (o.kind === "window") {
          if (wd >= 0.6) bar(uc, (z0 + z1) / 2, 0.035, o.h - rim, d, mat.frame);
          if (o.h >= 0.7 && wd >= 0.6) bar(uc, z0 + o.h * 0.5, wd - rim, 0.03, d, mat.frame);
        } else {
          const leaves = wd > 2.2 ? 4 : wd > 1.2 ? 2 : 1;
          for (let i = 1; i < leaves; i++) bar(u0 + (wd * i) / leaves, (z0 + z1) / 2, 0.06, o.h - rim, d, mat.frame);
          bar(uc, z0 + 0.85, wd - rim, 0.05, d, mat.frame);
        }
      }

      if (o.shutters) {
        const sw = wd / 2;
        for (const side of [-1, 1]) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(sw, o.h + 0.06, 0.035), mat.shutter);
          m.position.set(uc + side * (wd / 2 + sw / 2 + 0.03), (z0 + z1) / 2, face + 0.025);
          add(m, local);
        }
      }

      if (o.kind === "door" && o.id) {
        // Only doors in front of a bookable room get a marker.
        const room = doorRooms[o.id];
        if (!room) continue;
        // An invisible panel that catches the pointer, plus a marker dot.
        const hitMat = new THREE.MeshBasicMaterial({
          color: "#f6f1e7",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        disposables.push(hitMat);
        const hit = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), hitMat);
        hit.position.z = face + 0.012;
        hit.userData.doorId = o.id;
        disposables.push(hit.geometry);
        local.add(hit);

        const px = x0 + dx * uc;
        const py = y0 + dy * uc;
        const stand = o.stand ?? LEVEL.ground;
        const out = o.out ?? 2;
        const dotMap = dotTexture();
        disposables.push(dotMap);
        const dotMat = new THREE.SpriteMaterial({ map: dotMap, sizeAttenuation: false, depthWrite: false });
        disposables.push(dotMat);
        const dot = new THREE.Sprite(dotMat);
        dot.position.copy(P(px + dy * 0.3, py - dx * 0.3, o.sill + 1.5));
        dot.userData.doorId = o.id;
        group.add(dot);

        doors.push({
          id: o.id,
          room,
          eye: P(px + dy * out, py - dx * out, stand + EYE),
          look: P(px, py, stand + EYE - 0.25),
          hit,
          dot,
        });
      }
    }
  };
  walls.forEach(buildWall);

  // -- Roof -----------------------------------------------------------------
  {
    const lenX = ROOF.xMax - ROOF.xMin;
    const midX = (ROOF.xMin + ROOF.xMax) / 2;
    const cos = Math.cos(ROOF.pitch);
    for (const side of [-1, 1]) {
      // side -1 = south slope, +1 = north slope
      const eaveY = side < 0 ? ROOF.yMin : ROOF.yMax;
      const run = Math.abs(eaveY - ROOF.ridgeY);
      const slope = run / cos;
      const top = fitted("roof", lenX, slope, undefined, side > 0); // keep the overlap running downhill on both slopes
      const under = boxTimber(lenX, slope);
      const geo = new THREE.BoxGeometry(lenX, ROOF.thick, slope);
      const mesh = new THREE.Mesh(geo, [under, under, top, under, under, under]);
      const midY = (ROOF.ridgeY + eaveY) / 2;
      mesh.position.copy(P(midX, midY, roofTop(midY)));
      mesh.rotation.x = side < 0 ? ROOF.pitch : -ROOF.pitch;
      mesh.translateY(-ROOF.thick / 2);
      add(mesh);
    }
    // Ridge cap and the beams that carry the overhangs.
    slab(ROOF.xMin, ROOF.ridgeY - 0.14, ROOF.xMax, ROOF.ridgeY + 0.14, ROOF.ridge - 0.07, ROOF.ridge + 0.04, std({ color: shade(COLOR.roof, 0.85) }));
    for (const y of [0.12, 2.3, ROOF.ridgeY, 6.69, 8.87]) {
      const z = roofTop(y) - ROOF.thick / Math.cos(ROOF.pitch) - 0.01;
      slab(ROOF.xMin + 0.12, y - 0.08, ROOF.xMax - 0.12, y + 0.08, z - 0.2, z, mat.timberPlain);
    }
    // Chimney
    slab(
      chimney.x - chimney.w / 2,
      chimney.y - chimney.d / 2,
      chimney.x + chimney.w / 2,
      chimney.y + chimney.d / 2,
      7.9,
      chimney.top,
      mat.plasterPlain,
    );
    slab(
      chimney.x - chimney.w / 2 - 0.08,
      chimney.y - chimney.d / 2 - 0.08,
      chimney.x + chimney.w / 2 + 0.08,
      chimney.y + chimney.d / 2 + 0.08,
      chimney.top,
      chimney.top + 0.1,
      std({ color: shade(COLOR.roof, 0.8) }),
    );
  }

  // -- Balconies ------------------------------------------------------------
  for (const b of balconies) {
    const [x0, y0, x1, y1] = b.rect;
    slab(x0, y0, x1, y1, b.top - 0.14, b.top, mat.timberPlain);
    for (const [p, q] of b.rails) {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      boxBetween(p, q, b.top - 0.05, b.top + 0.87, 0.05, boxTimber(len, 0.92));
      boxBetween(p, q, b.top + 0.87, b.top + 0.93, 0.1, mat.timberPlain);
    }
    for (const [p, q] of b.screens) {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const topZ = Math.min(roofUnder(p[1]), roofUnder(q[1])) + 0.05;
      boxBetween(p, q, b.top - 0.05, topZ, 0.05, boxTimber(len, topZ - b.top + 0.05));
    }
    for (const [p, q] of b.aprons ?? []) {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const topZ = Math.min(roofUnder(p[1]), roofUnder(q[1])) + 0.05;
      const drop = b.apronDrop ?? 1;
      boxBetween(p, q, topZ - drop, topZ, 0.05, boxTimber(len, drop));
    }
    for (const [px, py] of b.posts) {
      const bottom = b.grounded ? LEVEL.ground : b.top;
      slab(px - 0.06, py - 0.06, px + 0.06, py + 0.06, bottom, roofUnder(py) + 0.05, mat.timberPlain);
    }
  }

  // -- Street-side balcony: the details seen in the street photo ---------------
  {
    const sb = streetBalcony;
    const deck = balconies.find((b) => b.id === "north")!.top;
    const cap = deck + 0.93; // top of the railing
    const wood = mat.timberPlain;
    // The beam under the hanging boards.
    slab(sb.x0, sb.front - 0.1, sb.x1, sb.front + 0.02, sb.beamBottom, sb.beamBottom + sb.beamHeight, wood);

    // Turned posts: square where they pass the railing and where they meet the beam, round
    // and shaped like a baluster in between.
    const shaftFrom = cap + 0.42;
    const shaftTo = sb.beamBottom - 0.26;
    const profile = [
      [0.06, 0],
      [0.066, 0.03],
      [0.046, 0.06],
      [0.064, 0.2],
      [0.058, 0.36],
      [0.04, 0.6],
      [0.034, 0.8],
      [0.05, 0.87],
      [0.062, 0.91],
      [0.046, 0.95],
      [0.06, 1],
    ].map(([r, t]) => new THREE.Vector2(r, t * (shaftTo - shaftFrom)));
    for (const px of sb.turnedPosts) {
      const py = sb.front - 0.06;
      slab(px - 0.06, py - 0.06, px + 0.06, py + 0.06, deck, shaftFrom, wood);
      slab(px - 0.06, py - 0.06, px + 0.06, py + 0.06, shaftTo, sb.beamBottom, wood);
      const shaft = new THREE.Mesh(new THREE.LatheGeometry(profile, 16), wood);
      shaft.position.copy(P(px, py, shaftFrom));
      add(shaft);
    }

    // Carved braces between post and beam.
    for (const { x, reach } of sb.braces) {
      const cut = new THREE.Shape();
      cut.moveTo(0, 0);
      cut.lineTo(0.36 * reach, 0);
      cut.lineTo(0.36 * reach, -0.07);
      cut.quadraticCurveTo(0.2 * reach, -0.07, 0.15 * reach, -0.17);
      cut.quadraticCurveTo(0.2 * reach, -0.24, 0.11 * reach, -0.29);
      cut.quadraticCurveTo(0.1 * reach, -0.37, 0, -0.37);
      cut.closePath();
      const brace = new THREE.Mesh(new THREE.ExtrudeGeometry(cut, { depth: 0.1, bevelEnabled: false }), wood);
      brace.position.copy(P(x, sb.front, sb.beamBottom));
      add(brace);
    }

    // Beam ends under the deck.
    for (const x of sb.consoles) {
      slab(x - 0.08, 8.99, x + 0.08, sb.front - 0.02, deck - 0.34, deck - 0.14, wood);
    }

    // Flower boxes on the outside of the railing, with a low mound of leaves and flowers.
    const boxMat = std({ color: "#9a5b3c" });
    const leaf = std({ color: "#4f7a3c", roughness: 1 });
    const blooms = [std({ color: "#d8558c", roughness: 1 }), std({ color: "#f0c63a", roughness: 1 }), std({ color: "#8d5fb5", roughness: 1 })];
    const ball = new THREE.IcosahedronGeometry(1, 1);
    disposables.push(ball);
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) % 1000) / 1000;
    sb.flowerBoxes.forEach(([xa, xb], n) => {
      slab(xa, sb.front + 0.03, xb, sb.front + 0.21, cap - 0.2, cap - 0.02, boxMat);
      const count = Math.round((xb - xa) / 0.07);
      for (let i = 0; i < count; i++) {
        const x = xa + 0.05 + ((xb - xa - 0.1) * (i + rnd() * 0.6)) / count;
        const y = sb.front + 0.08 + rnd() * 0.08;
        const green = new THREE.Mesh(ball, leaf);
        green.position.copy(P(x, y, cap + 0.01 + rnd() * 0.03));
        green.scale.set(0.055, 0.05 + rnd() * 0.03, 0.055);
        green.castShadow = true;
        group.add(green);
        if (rnd() < 0.75) {
          // the box nearer the corner is mostly yellow and pink, the other pink and violet
          const bloom = new THREE.Mesh(ball, blooms[n === 1 ? (rnd() < 0.6 ? 1 : 0) : rnd() < 0.5 ? 0 : 2]);
          bloom.position.copy(P(x + (rnd() - 0.5) * 0.04, y, cap + 0.09 + rnd() * 0.1));
          bloom.scale.setScalar(0.026 + rnd() * 0.014);
          group.add(bloom);
        }
      }
    });

    // Thin metal rails above the railing, on small uprights.
    const metal = std({ color: "#3b3f42", roughness: 0.45, metalness: 0.7 });
    const railY = sb.front + 0.02;
    const railX0 = sb.x0;
    const railX1 = sb.x1 - 0.05;
    for (const h of sb.metalRails) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, railX1 - railX0, 8), metal);
      rail.rotation.z = Math.PI / 2;
      rail.position.copy(P((railX0 + railX1) / 2, railY, cap + h));
      add(rail);
    }
    const top = Math.max(...sb.metalRails);
    for (let x = railX0 + 0.04; x <= railX1 + 0.001; x += (railX1 - railX0 - 0.08) / 4) {
      slab(x - 0.01, railY - 0.01, x + 0.01, railY + 0.01, cap, cap + top, metal);
    }
  }

  // -- Ground, terrace, drive -----------------------------------------------
  {
    // A surface draped over the terrain: a grid of points, each at the ground height there.
    const draped = (xs: number[], ys: number[], lift: number, material: THREE.Material) => {
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      for (const y of ys) {
        for (const x of xs) {
          const p = P(x, y, terrainHeight(x, y) + lift);
          pos.push(p.x, p.y, p.z);
          uv.push(x - CX, y - CY); // metres, so every ground surface shares one pattern
        }
      }
      const nx = xs.length;
      for (let j = 0; j < ys.length - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const a = j * nx + i;
          const c = a + nx;
          idx.push(a, a + 1, c + 1, a, c + 1, c);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      shadeUv(geo, CX, CY);
      const mesh = new THREE.Mesh(geo, material);
      mesh.receiveShadow = true;
      disposables.push(geo);
      group.add(mesh);
    };
    // A strip of paving along a straight line, level from side to side.
    const ribbon = (
      from: [number, number],
      to: [number, number],
      width: number,
      heightAt: (s: number) => number,
      material: THREE.Material,
    ) => {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const n = Math.ceil(len / 0.25);
      const ux = (to[0] - from[0]) / len;
      const uy = (to[1] - from[1]) / len;
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= n; i++) {
        const cx = from[0] + (ux * len * i) / n;
        const cy = from[1] + (uy * len * i) / n;
        for (const side of [-1, 1]) {
          // side -1 is to the right of the direction of travel, +1 to the left
          const x = cx - uy * side * (width / 2);
          const y = cy + ux * side * (width / 2);
          const p = P(x, y, heightAt((len * i) / n));
          pos.push(p.x, p.y, p.z);
          uv.push(x - CX, y - CY);
        }
        if (i < n) idx.push(2 * i, 2 * i + 2, 2 * i + 3, 2 * i, 2 * i + 3, 2 * i + 1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      shadeUv(geo, CX, CY);
      const mesh = new THREE.Mesh(geo, material);
      mesh.receiveShadow = true;
      disposables.push(geo);
      group.add(mesh);
    };
    const range = (from: number, to: number, step: number, extra: number[] = []) => {
      const out = new Set<number>(extra.filter((v) => v > from && v < to));
      for (let v = from; v < to; v += step) out.add(Math.round(v * 1000) / 1000);
      out.add(to);
      return Array.from(out).sort((p, q) => p - q);
    };

    // The sloped ground near the house, and a flat lawn around it out to the horizon.
    const near = { x0: -26, x1: 46, y0: -26, y1: 46 };
    const lawn = metres("grass");
    // Soft shading next to the walls and under the balconies, on lawn and paving alike.
    const footprint = walls.map((w) => w.from);
    const shade = groundShade(footprint, balconies.map((b) => b.rect));
    disposables.push(shade);
    lawn.aoMap = shade;
    mat.stone.aoMap = shade;
    const grassImage = surf.grass.map?.image as CanvasImageSource | undefined;
    const grassMean = grassImage ? imageMean(grassImage) : null;
    // The garden stays modelled lawn. Beyond it the ground is plain in the clean view. With the
    // surroundings shown it carries the official aerial photo: the turning circle that the
    // drive runs into, the road past the east side, the neighbours' roofs and the forest.
    const garden = { x0: -5, x1: 12.6, y0: -6, y1: 16 };
    // The generated grass image is a deep green; the real lawn is lighter. The tint sits between
    // the earlier, yellower one and the colour of the lawns in the aerial photo, so the garden
    // and the ground beyond it are close in colour where they meet.
    const LAWN_LIFT = new THREE.Color(1.24, 1.4, 1.15);
    lawn.color.copy(LAWN_LIFT);
    if (grassMean) {
      ground = patchyLawn(
        lawn,
        grassMean.luminance,
        [garden.x0 - CX, garden.x1 - CX, garden.y0 - CY, garden.y1 - CY],
        [-6.5 - CX, 17.5 - CX, -7 - CY, 17 - CY],
        new THREE.Color(COLOR.sky), // the plain ground of the clean view has the background's colour
        grassMean.color.clone().multiply(LAWN_LIFT),
      );
    }
    const foot = entranceSteps.xTop - entranceSteps.count * entranceSteps.tread - 0.05;
    draped(
      // finer around the entrance, where steps, bank and walkway meet
      range(near.x0, near.x1, 0.5, [foot, 5.6, drive.x0, drive.x0 + 0.05, drive.x1, ...range(3.75, 9.25, 0.25)]),
      range(near.y0, near.y1, 0.5, [8.99, 8.99 + entranceSteps.width, ...range(9.25, 17.25, 0.25)]),
      0,
      lawn,
    );
    {
      const far = new THREE.Shape();
      const R = 4000;
      far.moveTo(-R, -R);
      far.lineTo(R, -R);
      far.lineTo(R, R);
      far.lineTo(-R, R);
      far.lineTo(-R, -R);
      const hole = new THREE.Path();
      hole.moveTo(near.x0 - CX, near.y0 - CY);
      hole.lineTo(near.x0 - CX, near.y1 - CY);
      hole.lineTo(near.x1 - CX, near.y1 - CY);
      hole.lineTo(near.x1 - CX, near.y0 - CY);
      hole.lineTo(near.x0 - CX, near.y0 - CY);
      far.holes.push(hole);
      const geo = new THREE.ShapeGeometry(far);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, LEVEL.ground, 0);
      shadeUv(geo, CX, CY);
      const mesh = new THREE.Mesh(geo, lawn);
      mesh.receiveShadow = true;
      disposables.push(geo);
      group.add(mesh);
    }

    const g = LEVEL.ground;
    // Paving: one piece from the entrance, round the west side and the dining bay, to the garden terrace.
    {
      const paved = new THREE.Shape();
      paving.forEach(([px, py], i) => (i ? paved.lineTo(px - CX, py - CY) : paved.moveTo(px - CX, py - CY)));
      paved.closePath();
      const geo = new THREE.ExtrudeGeometry(paved, { depth: 0.13, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2); // lay the plan flat: north points to -z, the thickness points up
      geo.translate(0, g - 0.1, 0);
      shadeUv(geo, CX, CY);
      add(new THREE.Mesh(geo, mat.stone));
    }

    // The drive to the garage: paving laid on the slope, from the garage door towards the street.
    // (It starts 5 cm in from its west edge, where the ground has reached the full drive height.)
    draped([drive.x0 + 0.05, drive.x1], range(8.99, 8.99 + drive.length, 0.5), 0.03, mat.stone);

    // The sloped walkway from the side of the drive down to the entrance.
    ribbon(walkway.from, walkway.to, walkway.width, (s) => walkwayHeight(s) + 0.05, mat.stone);

    // Steps from the drive down to the entrance, with the handrail on the wall.
    {
      const st = entranceSteps;
      const rise = (st.top - st.bottom) / (st.count + 1);
      const stepMat = fitted("paving", st.tread, st.width);
      for (let k = 1; k <= st.count; k++) {
        const x1 = st.xTop - (k - 1) * st.tread;
        slab(x1 - st.tread, 8.99, x1, 8.99 + st.width, st.bottom, st.top - k * rise, stepMat);
      }
      // The last rise up to the drive is paved too, so no grass shows at the top of the steps.
      slab(st.xTop, 8.99, drive.x0 + 0.05, 8.99 + st.width, st.bottom, st.top + 0.028, stepMat);
      const [xa, za] = st.rail.from;
      const [xb, zb] = st.rail.to;
      const railMat = std({ color: "#b98452" });
      const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(xa - xb, za - zb), 0.05, 0.05), railMat);
      rail.position.copy(P((xa + xb) / 2, 8.99 + 0.09, (za + zb) / 2));
      rail.rotation.z = Math.atan2(za - zb, xa - xb);
      add(rail);
      for (const t of [0.12, 0.88]) {
        const bx = xa + (xb - xa) * t;
        const bz = za + (zb - za) * t;
        slab(bx - 0.015, 8.99, bx + 0.015, 8.99 + 0.09, bz - 0.06, bz - 0.03, mat.timberPlain);
      }
    }

    // Grass standing on the lawn near the house (not on paving, drive, walkway or steps).
    const inside = (poly: [number, number][], x: number, y: number) => {
      let hit = false;
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const [xa, ya] = poly[a];
        const [xb, yb] = poly[b];
        if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) hit = !hit;
      }
      return hit;
    };
    const [wax, way] = walkway.from;
    const [wbx, wby] = walkway.to;
    const wlen = Math.hypot(wbx - wax, wby - way);
    const isLawn = (x: number, y: number) => {
      // (not in the outer 3 m of the garden either, where the lawn is already fading out)
      if (x < garden.x0 + 3 || x > garden.x1 - 3 || y < garden.y0 + 3 || y > garden.y1 - 3) return false;
      if (inside(footprint, x, y) || inside(paving, x, y)) return false;
      if (x > drive.x0 - 0.05 && x < drive.x1 + 0.05 && y > 8.99 && y < 8.99 + drive.length) return false;
      const st = entranceSteps;
      if (x > st.xTop - st.count * st.tread - 0.1 && x < drive.x0 + 0.1 && y > 8.9 && y < 8.99 + st.width + 0.1) return false;
      const t = Math.min(wlen, Math.max(0, ((x - wax) * (wbx - wax) + (y - way) * (wby - way)) / wlen));
      const dx = x - (wax + ((wbx - wax) * t) / wlen);
      const dy = y - (way + ((wby - way) * t) / wlen);
      return Math.hypot(dx, dy) > walkway.width / 2 + 0.1;
    };
    if (grassMean) {
      const made = grassTufts({
        count: small ? 12000 : 36000,
        area: [-6, -7, 17, 18],
        isLawn,
        place: (x, y) => P(x, y, terrainHeight(x, y)),
        color: grassMean.color.clone().multiply(LAWN_LIFT),
      });
      disposables.push(made);
      group.add(made.mesh);
      tufts = made.mesh;
    }

    // Trees where the aerial photo shows them: the broad-leaved tree on the island of the turning circle,
    // the trees north-east of it and across the road, a bush by the circle, and the dark trees
    // close to the west side (the ones seen through the balcony in the street photo).
    // None stands between the street-side viewpoints and the house.
    const trees: ["spruce" | "leafy", number, number, number][] = [
      ["leafy", 2.3, 29.4, 9.5],
      ["leafy", 16.8, 30.4, 9],
      ["leafy", 21.2, 9.7, 6],
      ["leafy", -4.9, 23.7, 4.5],
      ["spruce", -7.6, 3.4, 10],
      ["leafy", -7.4, -2.8, 8],
    ];
    trees.forEach(([kind, tx, ty, th], n) => {
      const tree = buildTree(kind, th, 11 + n * 7, null);
      tree.group.position.copy(P(tx, ty, terrainHeight(tx, ty) - 0.05));
      disposables.push(tree);
      group.add(tree.group);
      around.push(tree.group);
    });

    // The edge of the forest that climbs the hillside north of the house (traced on the aerial).
    {
      const belt = spruceBelt({
        edge: [
          [-78, 102],
          [-50, 95],
          [-38, 78],
          [-11, 73],
          [22, 76],
          [49, 73],
          [87, 75],
          [121, 76],
          [177, 77],
        ],
        count: small ? 90 : 150,
        depth: 34,
        place: (x, y, lift) => P(x, y, LEVEL.ground + lift - 0.3),
      });
      disposables.push(belt);
      group.add(belt.mesh);
      around.push(belt.mesh);
      clearForest = belt.clear;
    }
  }

  return { group, doors, tufts, clearForest, ground, around, dispose: () => disposables.forEach((d) => d.dispose()) };
}

// ---------------------------------------------------------------------------
// Scene, camera and pointer handling
// ---------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Where the landing-page photo (public/hero.jpg) was taken from, so the 3D view
 * can start as the same picture. Measured off the photo against the plan:
 * the camera stands north of the house, level, looking due south.
 */
const PHOTO = {
  w: 1871,
  h: 1041,
  /** Focal length in photo pixels. */
  focal: 760,
  /** Where the optical centre falls in the photo, in photo pixels. The photo is the lower part of a taller view. */
  cx: 935.5,
  cy: 339,
  /** Plan x, plan y, height: 7.5 m north of the street-side wall, 4.5 m up. */
  eye: [4.78, 16.49, 4.51] as const,
  /** The CSS object-position the photo is shown with. */
  posX: 0.5,
  posY: 0.28,
};

/** Focal length in screen pixels, and where the optical centre sits on the canvas. */
type Projection = { f: number; cx: number; cy: number };

export type RoomHover = { slug: string; x: number; y: number };

export type SceneOptions = {
  /** The element showing the hero photo. With it, the scene opens on the photo's viewpoint. */
  photo: HTMLElement | null;
  /** Called with the current view, or null while the camera is being moved by scrolling. */
  onMode: (m: ViewMode | null) => void;
  /** A room marker is hovered (with its position on the canvas), or null when none is. */
  onHover?: (h: RoomHover | null) => void;
  /** A room marker was clicked: open that room. */
  onOpen?: (slug: string) => void;
  /** The camera follows setProgress() instead of playing the opening on a timer. */
  scrollDriven?: boolean;
  /** The scene sits inside a scrolling page: the wheel and vertical swipes scroll the page. */
  embedded?: boolean;
};

export function createHouseScene(host: HTMLElement, opts: SceneOptions): SceneHandle {
  const { photo, onMode, onHover, onOpen } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.style.display = "block";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.touchAction = opts.embedded ? "pan-y" : "none";
  el.style.cursor = "grab";
  host.appendChild(el);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR.sky);
  scene.fog = new THREE.Fog(COLOR.sky, 35, 150);

  // Until the sky has loaded, a plain light from above stands in for it.
  const skyFill = new THREE.HemisphereLight("#ffffff", "#cfc8b6", 1.25);
  scene.add(skyFill);
  const sun = new THREE.DirectionalLight("#fff3df", 2.1);
  sun.position.copy(P(-12, 12, 24));
  sun.target.position.set(0, 2, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#ffffff", 0.55);
  const small = window.matchMedia("(pointer: coarse)").matches;
  let sky: Sky | null = null;
  fill.position.copy(P(20, -14, 12));
  scene.add(fill);

  // The house is added once its surfaces have loaded.
  let house: ReturnType<typeof buildHouse> | null = null;
  let surfaces: Surfaces | null = null;
  let disposed = false;
  let dotsOn = !photo;
  const pickables: THREE.Object3D[] = [];
  const showDots = (on: boolean) => {
    dotsOn = on;
    house?.doors.forEach((d) => (d.dot.visible = on));
  };
  // The sky photo is the backdrop and the main source of soft light. With it in place the
  // stand-in lights are turned down, and the far lawn fades into the colour of the distance.
  const skyReady = loadSky(renderer, scene, small).then((loaded) => {
    if (!loaded) return;
    if (disposed) {
      loaded.dispose();
      return;
    }
    sky = loaded;
    scene.add(loaded.dome);
    scene.environmentIntensity = 0.9;
    skyFill.intensity = 0.2;
    fill.intensity = 0.2;
  });
  const ready = Promise.all([loadSurfaces(), skyReady]).then(([loaded]) => {
    if (disposed) {
      loaded.dispose();
      return;
    }
    surfaces = loaded;
    house = buildHouse(loaded, small);
    scene.add(house.group);
    house.group.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) pickables.push(o);
    });
    showDots(dotsOn);
    showAround(0);
  });

  // -- Surroundings -----------------------------------------------------------
  // 0 = clean view, 1 = surroundings shown. `v` runs towards `target` over about two seconds.
  const surround = { v: 0, target: 0 };
  let photos: GroundPhotos | null = null;
  let photosState: "none" | "loading" | "ready" | "failed" = "none";
  const CLEAN = new THREE.Color(COLOR.sky);
  /** Trees rise out of the ground as the surroundings come in. */
  const showAround = (e: number) => {
    for (const o of house?.around ?? []) {
      o.visible = e > 0.001;
      if (o instanceof THREE.InstancedMesh) o.scale.set(1, Math.max(e, 0.001), 1);
      else o.scale.setScalar(Math.max(e, 0.001));
    }
  };

  const camera = new THREE.PerspectiveCamera(FOV_ORBIT, 1, 0.05, 400);
  const target = new THREE.Vector3(0, 3.1, 0);
  const size = { w: 1, h: 1 };

  // -- Projection -----------------------------------------------------------
  const centred = (fovDeg: number): Projection => ({
    f: size.h / 2 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2),
    cx: size.w / 2,
    cy: size.h / 2,
  });
  /** The projection that lays the 3D view exactly over the photo as it is shown on screen. */
  const photoProjection = (): Projection => {
    if (!photo) return centred(FOV_ORBIT);
    const r = photo.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    const s = Math.max(r.width / PHOTO.w, r.height / PHOTO.h);
    const left = r.left - c.left + (r.width - PHOTO.w * s) * PHOTO.posX;
    const top = r.top - c.top + (r.height - PHOTO.h * s) * PHOTO.posY;
    return { f: PHOTO.focal * s, cx: left + PHOTO.cx * s, cy: top + PHOTO.cy * s };
  };
  const applyProjection = (p: Projection) => {
    const fw = 2 * Math.max(p.cx, size.w - p.cx);
    const fh = 2 * Math.max(p.cy, size.h - p.cy);
    camera.aspect = fw / fh;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fh / 2 / p.f));
    if (Math.abs(fw - size.w) < 0.5 && Math.abs(fh - size.h) < 0.5) {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    } else {
      camera.setViewOffset(fw, fh, fw / 2 - p.cx, fh / 2 - p.cy, size.w, size.h);
    }
  };

  // -- Orbit view -----------------------------------------------------------
  // Home is the street side, a little to the west and from above.
  const HOME = { yaw: Math.PI + 0.38, pitch: 0.3 };
  let fit = 40;
  const orbit = { yaw: HOME.yaw, pitch: HOME.pitch, zoom: 1, tYaw: HOME.yaw, tPitch: HOME.pitch, tZoom: 1 };
  // How far the free view may pull back: far enough to see the village around the house.
  const MAX_AWAY = 430;
  // In the clean view the house stays large on screen.
  const CLEAN_ZOOM = 1.45;
  const maxZoom = () => (surround.target ? Math.max(1.7, MAX_AWAY / fit) : CLEAN_ZOOM);
  const orbitPose = (yaw: number, pitch: number, zoom: number) => {
    const d = fit * zoom;
    const pos = new THREE.Vector3(
      target.x + d * Math.cos(pitch) * Math.sin(yaw),
      target.y + d * Math.sin(pitch),
      target.z + d * Math.cos(pitch) * Math.cos(yaw),
    );
    const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  };

  // -- Door view: stand still and look around ---------------------------------
  const look = { yaw: 0, pitch: 0, pos: new THREE.Vector3() };

  type Mode = ViewMode | "photo" | "moving" | "scroll";
  let mode: Mode = opts.scrollDriven ? "scroll" : photo ? "photo" : "orbit";
  let progress = 0;
  let active = true;
  let tween: null | {
    t0: number;
    dur: number;
    fromPos: THREE.Vector3;
    fromQuat: THREE.Quaternion;
    fromProj: Projection;
    toPos: THREE.Vector3;
    toQuat: THREE.Quaternion;
    toProj: () => Projection;
    /** If set, the camera follows this instead of blending straight from start to end. */
    path?: (e: number) => { pos: THREE.Vector3; quat: THREE.Quaternion; proj: Projection };
    done: () => void;
  } = null;
  let current: Projection = centred(FOV_ORBIT);

  const startTween = (
    toPos: THREE.Vector3,
    toQuat: THREE.Quaternion,
    toProj: () => Projection,
    dur: number,
    done: () => void,
    path?: (e: number) => { pos: THREE.Vector3; quat: THREE.Quaternion; proj: Projection },
  ) => {
    tween = {
      t0: performance.now(),
      dur,
      fromPos: camera.position.clone(),
      fromQuat: camera.quaternion.clone(),
      fromProj: { ...current },
      toPos,
      toQuat,
      toProj,
      path,
      done,
    };
    mode = "moving";
  };
  const travelTime = (to: THREE.Vector3) => clamp(700 + camera.position.distanceTo(to) * 28, 900, 1900);

  const goToDoor = (d: Door) => {
    const dir = d.look.clone().sub(d.eye).normalize();
    const yaw = Math.atan2(-dir.x, -dir.z);
    const pitch = Math.asin(dir.y);
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    setHover(null);
    showDots(false);
    onMode("door");
    startTween(d.eye.clone(), quat, () => centred(FOV_DOOR), travelTime(d.eye), () => {
      look.pos.copy(d.eye);
      look.yaw = yaw;
      look.pitch = pitch;
      mode = "door";
    });
  };

  const toOrbit = (dur?: number) => {
    orbit.yaw = orbit.tYaw;
    orbit.pitch = orbit.tPitch;
    orbit.zoom = orbit.tZoom;
    const pose = orbitPose(orbit.yaw, orbit.pitch, orbit.zoom);
    const fromPhoto = mode === "photo";
    startTween(
      pose.pos,
      pose.quat,
      () => centred(FOV_ORBIT),
      dur ?? travelTime(pose.pos),
      () => {
        mode = "orbit";
        showDots(true);
        onMode("orbit");
      },
      fromPhoto ? (e) => fromPhotoView(e, orbit.yaw, orbit.pitch, orbit.zoom) : undefined,
    );
  };

  const back = () => {
    if (mode === "door" || (mode === "moving" && tween)) toOrbit();
  };
  /** Leave the photo's viewpoint: pull back and rise to the home view. */
  const reveal = (ms = 3800) => {
    if (mode === "photo") toOrbit(ms);
  };

  // -- Sizing ---------------------------------------------------------------
  const resize = () => {
    size.w = host.clientWidth || 1;
    size.h = host.clientHeight || 1;
    renderer.setSize(size.w, size.h, false);
    const v = THREE.MathUtils.degToRad(FOV_ORBIT) / 2;
    const hHalf = Math.atan((Math.tan(v) * size.w) / size.h);
    fit = Math.max(11.5 / Math.tan(hHalf), 8.2 / Math.tan(v));
    // On a tall, narrow screen the camera stands much further back, so the haze moves with it.
    if (mode === "photo" || mode === "scroll") current = photoProjection();
    else if (mode === "door") current = centred(FOV_DOOR);
    else if (mode === "orbit") current = centred(FOV_ORBIT);
    applyProjection(current);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const photoPos = P(PHOTO.eye[0], PHOTO.eye[1], PHOTO.eye[2]);
  const photoQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "YXZ")); // level, looking due south
  if (mode === "photo" || mode === "scroll") {
    camera.position.copy(photoPos);
    camera.quaternion.copy(photoQuat);
    showDots(false);
  }

  // The way from the photo's viewpoint (e = 0) to the free view (e = 1). The camera swings
  // round the house on an arc and keeps looking at it, so the house stays in the middle of
  // the picture and only ever grows. (Blending position and direction separately lets the
  // house drift sideways on the way, badly so on a narrow phone screen, where the free view
  // stands twice as far back.)
  const photoRel = photoPos.clone().sub(target);
  const photoDist = photoRel.length();
  const photoYaw = Math.atan2(photoRel.x, photoRel.z);
  const photoPitch = Math.asin(photoRel.y / photoDist);
  const photoLook = photoPos.clone().add(new THREE.Vector3(0, 0, photoDist)); // straight ahead, due south
  const upAxis = new THREE.Vector3(0, 1, 0);
  function fromPhotoView(e: number, yaw: number, pitch: number, zoom: number) {
    const endDist = fit * zoom;
    let turn = yaw - photoYaw;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn)); // the short way round
    const y = photoYaw + turn * e;
    const p = lerp(photoPitch, pitch, e);
    const d = photoDist * Math.pow(endDist / photoDist, e);
    const pos = new THREE.Vector3(
      target.x + d * Math.cos(p) * Math.sin(y),
      target.y + d * Math.sin(p),
      target.z + d * Math.cos(p) * Math.cos(y),
    );
    const lookAt = photoLook.clone().lerp(target, e);
    const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, lookAt, upAxis));
    const a = photoProjection();
    const b = centred(FOV_ORBIT);
    // blend the size of the house on screen, then work out the lens that gives it at this distance
    const proj: Projection = {
      f: lerp(a.f / photoDist, b.f / endDist, e) * d,
      cx: lerp(a.cx, b.cx, e),
      cy: lerp(a.cy, b.cy, e),
    };
    return { pos, quat, proj };
  }

  const setProgress = (p: number) => {
    progress = clamp(p, 0, 1);
    if (progress >= 1) {
      if (mode === "scroll") {
        orbit.yaw = orbit.tYaw;
        orbit.pitch = orbit.tPitch;
        orbit.zoom = orbit.tZoom;
        current = centred(FOV_ORBIT);
        applyProjection(current);
        mode = "orbit";
        showDots(true);
        onMode("orbit");
      }
    } else if (mode !== "scroll") {
      // Scrolling back up takes over again, from wherever the view was left.
      tween = null;
      setHover(null);
      showDots(false);
      mode = "scroll";
      onMode(null);
    }
  };
  const setActive = (on: boolean) => {
    active = on;
  };

  // -- Picking --------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: Door | null = null;
  const toScreen = (p: THREE.Vector3) => {
    const v = p.clone().project(camera);
    return { x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h };
  };
  function setHover(d: Door | null) {
    if (hovered === d) return;
    if (hovered) (hovered.hit.material as THREE.MeshBasicMaterial).opacity = 0;
    hovered = d;
    if (d) {
      (d.hit.material as THREE.MeshBasicMaterial).opacity = 0.32;
      const s = toScreen(d.dot.position);
      onHover?.({ slug: d.room, x: s.x, y: s.y });
    } else {
      onHover?.(null);
    }
    el.style.cursor = d ? "pointer" : "grab";
  }
  const doorAt = (clientX: number, clientY: number): Door | null => {
    const r = el.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    const id = hits[0]?.object.userData.doorId as string | undefined;
    return id ? house?.doors.find((d) => d.id === id) ?? null : null;
  };

  // -- Pointer --------------------------------------------------------------
  const pointers = new Map<number, { x: number; y: number }>();
  let travelled = 0;
  let pinch = 0;
  const spread = () => {
    const [a, b] = Array.from(pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const steady = () => mode === "orbit" || mode === "door";

  const onDown = (e: PointerEvent) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) travelled = 0;
    if (pointers.size === 2) pinch = spread();
    if (!hovered) el.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === "mouse" && steady()) setHover(doorAt(e.clientX, e.clientY));
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 1) {
      travelled += Math.abs(dx) + Math.abs(dy);
      if (travelled > 6) setHover(null);
      if (mode === "orbit") {
        orbit.tYaw -= dx * 0.008;
        orbit.tPitch = clamp(orbit.tPitch + dy * 0.006, 0.03, 1.35);
      } else if (mode === "door") {
        look.yaw += dx * 0.0042;
        look.pitch = clamp(look.pitch + dy * 0.0042, -1.2, 1.2);
      }
    } else if (pointers.size === 2) {
      const s = spread();
      if (pinch > 0 && mode === "orbit") orbit.tZoom = clamp((orbit.tZoom * pinch) / s, 0.45, maxZoom());
      pinch = s;
      travelled += 20;
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    const click = pointers.size === 1 && travelled < 6 && e.type === "pointerup";
    pointers.delete(e.pointerId);
    pinch = 0;
    el.style.cursor = hovered ? "pointer" : "grab";
    if (click && steady()) {
      const d = doorAt(e.clientX, e.clientY);
      if (d) onOpen?.(d.room);
    }
  };
  const onWheel = (e: WheelEvent) => {
    // Inside a scrolling page the wheel scrolls the page; pinch (ctrl + wheel) still zooms.
    if (opts.embedded && !e.ctrlKey) return;
    e.preventDefault();
    if (mode === "orbit") orbit.tZoom = clamp(orbit.tZoom * Math.exp(e.deltaY * 0.0012), 0.45, maxZoom());
  };
  const onDouble = (e: MouseEvent) => {
    if (mode !== "orbit" || doorAt(e.clientX, e.clientY)) return;
    orbit.tYaw = HOME.yaw + Math.round((orbit.yaw - HOME.yaw) / (Math.PI * 2)) * Math.PI * 2;
    orbit.tPitch = HOME.pitch;
    orbit.tZoom = 1;
  };
  const onLeave = () => setHover(null);

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("dblclick", onDouble);

  // -- Depth range -----------------------------------------------------------
  // The nearest thing the camera draws is kept as far out as the view allows. With a fixed
  // 5 cm near limit, a camera standing 80 m back (the free view on a phone) cannot tell the
  // paving from the lawn 3 cm below it, and the ground flickers while the camera moves.
  // Close to the house (door views) the limit stays at 5 cm.
  const surroundEase = () => surround.v * surround.v * (3 - 2 * surround.v);
  const HOUSE_BOX = new THREE.Box3(new THREE.Vector3(-8.5, -0.6, -7.5), new THREE.Vector3(8.5, 10.5, 7.5));
  const updateClip = () => {
    const away = HOUSE_BOX.distanceToPoint(camera.position);
    const near = clamp(away * 0.12, 0.05, 12);
    const far = Math.max(1100, away * 4 + 900);
    // Clean view: the plain ground melts into the background a little way behind the house.
    // Surroundings: the haze starts well beyond the house and thickens towards the horizon,
    // however far back the camera is.
    if (scene.fog instanceof THREE.Fog) {
      const e = surroundEase();
      scene.fog.near = lerp(away + 26, Math.max(80, away * 1.6), e);
      scene.fog.far = lerp(away + 100, Math.max(420, away * 4.5), e);
      scene.fog.color.copy(CLEAN);
      if (sky) scene.fog.color.lerp(sky.haze, e);
    }
    if (Math.abs(near - camera.near) > camera.near * 0.02 || Math.abs(far - camera.far) > 1) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  };

  // -- Loop -----------------------------------------------------------------
  let raf = 0;
  let lastFrame = performance.now();
  let glideUntil = 0;
  const SURROUND_MS = 2200;
  const setSurroundings = (on: boolean) => {
    const go = () => {
      surround.target = on ? 1 : 0;
      glideUntil = performance.now() + 3200;
      if (on) {
        // far enough back to see the turning circle and the nearest roofs, looking down a little more
        orbit.tZoom = Math.max(orbit.tZoom, clamp(88 / fit, 1.25, maxZoom()));
        orbit.tPitch = Math.max(orbit.tPitch, 0.52);
      } else {
        orbit.tZoom = Math.min(orbit.tZoom, 1);
        orbit.tPitch = Math.min(orbit.tPitch, Math.max(HOME.pitch, 0.3));
      }
    };
    if (!on || photosState === "ready") return go();
    if (photosState === "loading") return;
    photosState = "loading";
    loadGroundPhotos().then((loaded) => {
      if (disposed) {
        loaded?.aerial.dispose();
        loaded?.wide?.dispose();
        loaded?.close?.dispose();
        return;
      }
      photos = loaded;
      photosState = loaded ? "ready" : "failed";
      if (!loaded) return;
      ready.then(() => {
        house?.ground?.setPhotos(loaded);
        // one frame with the photos in place (still invisible), so the first visible frame does not stall
        renderer.render(scene, camera);
        go();
      });
    });
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!active) return;
    if (mode === "scroll") {
      const view = fromPhotoView(ease(progress), orbit.tYaw, orbit.tPitch, orbit.tZoom);
      camera.position.copy(view.pos);
      camera.quaternion.copy(view.quat);
      current = view.proj;
      applyProjection(current);
    } else if (tween) {
      const k = clamp((now - tween.t0) / tween.dur, 0, 1);
      const e = ease(k);
      if (tween.path) {
        const view = tween.path(e);
        camera.position.copy(view.pos);
        camera.quaternion.copy(view.quat);
        current = view.proj;
      } else {
        const to = tween.toProj();
        camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
        camera.quaternion.slerpQuaternions(tween.fromQuat, tween.toQuat, e);
        current = {
          f: lerp(tween.fromProj.f, to.f, e),
          cx: lerp(tween.fromProj.cx, to.cx, e),
          cy: lerp(tween.fromProj.cy, to.cy, e),
        };
      }
      applyProjection(current);
      if (k >= 1) {
        const done = tween.done;
        tween = null;
        done();
      }
    } else if (mode === "orbit") {
      // The camera glides while the surroundings come and go, and follows the hand otherwise.
      const k = now < glideUntil ? 0.045 : 0.18;
      orbit.yaw += (orbit.tYaw - orbit.yaw) * 0.18;
      orbit.pitch += (orbit.tPitch - orbit.pitch) * k;
      orbit.zoom += (orbit.tZoom - orbit.zoom) * k;
      const pose = orbitPose(orbit.yaw, orbit.pitch, orbit.zoom);
      camera.position.copy(pose.pos);
      camera.quaternion.copy(pose.quat);
    } else if (mode === "door") {
      camera.position.copy(look.pos);
      camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
    }
    // Surroundings blend in and out: backdrop, aerial photo on the ground, trees.
    const dt = Math.min(100, now - lastFrame);
    lastFrame = now;
    if (surround.v !== surround.target) {
      surround.v = clamp(surround.v + (surround.target > surround.v ? 1 : -1) * (dt / SURROUND_MS), 0, 1);
    }
    {
      const e = surroundEase();
      if (house?.ground) house.ground.surround.value = e;
      sky?.setOpacity(e);
      showAround(e);
    }
    updateClip();
    if (sky?.dome.visible) {
      sky.dome.position.copy(camera.position);
      sky.dome.scale.setScalar(camera.far * 0.9);
    }
    // Grass blades are smaller than a pixel from far away and would only shimmer.
    if (house?.tufts) house.tufts.visible = camera.position.distanceTo(target) < 40;
    house?.clearForest?.(camera.position);
    // Room markers keep their size on screen; pulled far back they shrink, so they do not cover the house.
    const farBack = Math.min(1, (fit * 1.7) / Math.max(1, camera.position.distanceTo(target)));
    const pulse = 0.03 * clamp(size.w / size.h, 0.45, 1) * (1 + 0.1 * Math.sin(now / 420)) * Math.max(0.3, farBack);
    for (const d of house?.doors ?? []) d.dot.scale.set(pulse, pulse, 1);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    back,
    reveal,
    setProgress,
    setActive,
    setSurroundings,
    ready,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDouble);
      disposed = true;
      sky?.dispose();
      photos?.aerial.dispose();
      photos?.wide?.dispose();
      photos?.close?.dispose();
      house?.dispose();
      surfaces?.dispose();
      renderer.dispose();
      el.remove();
    },
  };
}
