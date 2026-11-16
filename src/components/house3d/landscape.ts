import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Everything around the house that makes the scene read as a place: the sky and
// the light that comes from it, the soft shading where the house meets the ground,
// the lawn, and the trees.

// ---------------------------------------------------------------------------
// Sky. Two wide landscape photos (generated with FLUX, each about 180° wide) are
// joined into a full circle: a wooded hillside to the north and east, where the
// forest stands in reality, and the open valley with the mountains to the south
// and west. It is the backdrop, and it lights the scene.
// ---------------------------------------------------------------------------
export type Sky = { haze: THREE.Color; dispose: () => void };

/** The two halves, and how far down each photo its horizon sits (0 = top edge, 1 = bottom edge). */
const SKY_HALVES = {
  north: { url: "/house3d/sky-north.jpg", horizon: 0.615 },
  south: { url: "/house3d/sky-south.jpg", horizon: 0.605 },
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(url));
    i.src = url;
  });

export async function loadSky(renderer: THREE.WebGLRenderer, scene: THREE.Scene, small: boolean): Promise<Sky | null> {
  let north: HTMLImageElement;
  let south: HTMLImageElement;
  try {
    [north, south] = await Promise.all([loadImage(SKY_HALVES.north.url), loadImage(SKY_HALVES.south.url)]);
  } catch {
    return null;
  }
  const W = small || renderer.capabilities.maxTextureSize < 4096 ? 2048 : 4096;
  const H = W / 2;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // Each photo covers half of the height (90° from top to bottom), placed so that its horizon
  // lies on the horizon of the scene. Across the picture, left to right: west, north, east,
  // south, west. Each photo is drawn a little wider than its half, and the valley photo is
  // faded into the forest photo where they meet (due east and due west).
  const bandH = H / 2;
  const lap = Math.round(W * 0.035);
  const wide = W / 2 + 2 * lap;
  const topN = Math.round(H / 2 - SKY_HALVES.north.horizon * bandH);
  const topS = Math.round(H / 2 - SKY_HALVES.south.horizon * bandH);
  g.drawImage(north, -lap, topN, wide, bandH);
  g.drawImage(north, W - lap, topN, wide, bandH);
  const half = document.createElement("canvas");
  half.width = wide;
  half.height = bandH;
  const hg = half.getContext("2d")!;
  hg.drawImage(south, 0, 0, wide, bandH);
  hg.globalCompositeOperation = "destination-in";
  const ends = hg.createLinearGradient(0, 0, wide, 0);
  ends.addColorStop(0, "rgba(0,0,0,0)");
  ends.addColorStop((2 * lap) / wide, "rgba(0,0,0,1)");
  ends.addColorStop(1 - (2 * lap) / wide, "rgba(0,0,0,1)");
  ends.addColorStop(1, "rgba(0,0,0,0)");
  hg.fillStyle = ends;
  hg.fillRect(0, 0, wide, bandH);
  g.drawImage(half, W / 2 - lap, topS);
  g.drawImage(half, -W / 2 - lap, topS);
  // Above and below the photos: plain sky, deepening towards the top, and plain meadow. The
  // photos' own edges are faded into them, so no cloud or grass is cut off in a straight line.
  const average = (x: number, y: number, w: number) => {
    const d = g.getImageData(x, y, w, 4).data;
    let r0 = 0;
    let g0 = 0;
    let b0 = 0;
    for (let i = 0; i < d.length; i += 4) {
      r0 += d[i];
      g0 += d[i + 1];
      b0 += d[i + 2];
    }
    const k = d.length / 4;
    return [r0 / k, g0 / k, b0 / k].map((v) => Math.round(v));
  };
  const top = Math.max(topN, topS);
  const bottom = Math.min(topN, topS) + bandH;
  // The sky colour is read from the valley photo, which has open sky along its whole top edge.
  const skyTop = average(Math.round(W * 0.56), topS + 2, Math.round(W * 0.38));
  const meadow = average(0, bottom - 6, W);
  const rgb = (v: number[], a = 1) => `rgba(${v[0]},${v[1]},${v[2]},${a})`;
  const fade = Math.round(bandH * 0.12);
  const up = g.createLinearGradient(0, 0, 0, top + fade);
  up.addColorStop(0, rgb(skyTop.map((v, i) => v * (i === 2 ? 0.86 : 0.62))));
  up.addColorStop(top / (top + fade), rgb(skyTop));
  up.addColorStop(1, rgb(skyTop, 0));
  g.fillStyle = up;
  g.fillRect(0, 0, W, top + fade);
  const down = g.createLinearGradient(0, bottom - fade, 0, H);
  down.addColorStop(0, rgb(meadow, 0));
  down.addColorStop(fade / (H - bottom + fade), rgb(meadow));
  down.addColorStop(1, rgb(meadow));
  g.fillStyle = down;
  g.fillRect(0, bottom - fade, W, H - bottom + fade);

  // The colour of the far distance, read just under the horizon and lightened: the lawn fades into it.
  const row = g.getImageData(0, Math.round(H * 0.515), W, Math.max(1, Math.round(H * 0.015))).data;
  let r = 0;
  let gr = 0;
  let b = 0;
  for (let i = 0; i < row.length; i += 4) {
    r += row[i];
    gr += row[i + 1];
    b += row[i + 2];
  }
  const n = row.length / 4;
  const haze = new THREE.Color().setRGB(r / n / 255, gr / n / 255, b / n / 255, THREE.SRGBColorSpace);
  haze.lerp(new THREE.Color("#dfe7e6"), 0.45);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  // The light that the scene takes from this picture is made paler than the picture itself.
  // Forest and meadow fill most of it, and at full colour they would turn the white walls green.
  const pale = document.createElement("canvas");
  pale.width = W / 4;
  pale.height = H / 4;
  const pg = pale.getContext("2d")!;
  pg.drawImage(c, 0, 0, pale.width, pale.height);
  pg.globalCompositeOperation = "saturation";
  pg.globalAlpha = 0.7;
  pg.fillStyle = "#808080";
  pg.fillRect(0, 0, pale.width, pale.height);
  const light = new THREE.CanvasTexture(pale);
  light.mapping = THREE.EquirectangularReflectionMapping;
  light.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(light);
  pmrem.dispose();
  light.dispose();
  scene.background = tex;
  scene.environment = env.texture;
  return {
    haze,
    dispose: () => {
      tex.dispose();
      env.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Soft shading on the ground next to the house. Light from the sky reaches the
// ground less where a wall or a balcony stands over it. This is painted once into
// a small map of the plot and applied to every ground surface.
// ---------------------------------------------------------------------------
const AO = { x0: -12, y0: -12, size: 36, px: 512 };

export function groundShade(footprint: [number, number][], overhangs: [number, number, number, number][]) {
  const c = document.createElement("canvas");
  c.width = c.height = AO.px;
  const g = c.getContext("2d")!;
  const k = AO.px / AO.size;
  const X = (x: number) => (x - AO.x0) * k;
  const Y = (y: number) => AO.px - (y - AO.y0) * k;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, AO.px, AO.px);
  // Shapes are drawn off to the side with a blurred shadow that lands on the map. (Works in
  // every browser, unlike canvas blur filters.)
  const OFF = AO.px * 3;
  const soft = (blurMetres: number, alpha: number, draw: () => void) => {
    g.save();
    g.shadowColor = `rgba(0,0,0,${alpha})`;
    g.shadowBlur = blurMetres * k;
    g.shadowOffsetX = OFF;
    g.translate(-OFF, 0);
    g.fillStyle = "#000";
    draw();
    g.restore();
  };
  const house = () => {
    g.beginPath();
    footprint.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
    g.closePath();
    g.fill();
  };
  soft(2.2, 0.35, house); // wide and faint
  soft(0.7, 0.55, house); // tight against the walls
  for (const [x0, y0, x1, y1] of overhangs) {
    soft(0.6, 0.3, () => g.fillRect(X(x0), Y(y1), (x1 - x0) * k, (y1 - y0) * k));
  }
  const t = new THREE.CanvasTexture(c);
  t.channel = 1; // read with the second set of texture coordinates (see shadeUv)
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Give a ground geometry the coordinates the shading map is read with. `cx`, `cy`: plan centre. */
export function shadeUv(geo: THREE.BufferGeometry, cx: number, cy: number) {
  const pos = geo.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx; // plan east
    const y = cy - pos.getZ(i); // plan north
    uv[i * 2] = (x - AO.x0) / AO.size;
    uv[i * 2 + 1] = (y - AO.y0) / AO.size;
  }
  geo.setAttribute("uv1", new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------------------
// Lawn. One grass image repeated every few metres shows as a grid from above. The
// same image is read twice more at much larger sizes and used to make some patches
// darker and some lighter and yellower, which hides the repeat.
// ---------------------------------------------------------------------------
/**
 * Where the official aerial photo (public/house3d/aerial.jpg) lies on the ground. The house is
 * the one directly south of the turning circle, as the site plan in the 1996 permit shows.
 * Measured on the photo: the middle of its roof is at pixel (1157.75, 1307) of 2048, one pixel
 * is 0.20508 m, and the house is turned 12.1° clockwise from north. With these the four roof
 * corners and the chimney of the model land on the photo within about 0.5 m.
 */
const AERIAL = { px: 1157.75, py: 1307, size: 2048, metres: 0.20508, turn: (12.1 * Math.PI) / 180 };

/**
 * Two more photos, both centred on the house. aerial-wide.jpg is the same official aerial for
 * the village around (1260 m square). aerial-close.jpg is the middle 105 m of aerial.jpg,
 * redrawn four times sharper with FLUX: positions are unchanged, the fine detail is invented.
 */
const AERIAL_WIDE_M = 1260;
const AERIAL_CLOSE_M = 512 * AERIAL.metres;

export function patchyLawn(
  material: THREE.MeshStandardMaterial,
  meanLuminance: number,
  /** The aerial photos, and the area around the house (east and north of its centre, in metres:
   *  x0, x1, y0, y1) that stays modelled lawn. The photo takes over across a soft, uneven band
   *  around it. `wide` shows the village from far away, `close` is a sharper copy of the
   *  100 m around the house. */
  far?: {
    aerial: THREE.Texture;
    wide: THREE.Texture | null;
    close: THREE.Texture | null;
    keep: [number, number, number, number];
  },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLawnMean = { value: meanLuminance };
    shader.uniforms.uAerial = { value: far?.aerial ?? null };
    shader.uniforms.uAerialWide = { value: far?.wide ?? far?.aerial ?? null };
    shader.uniforms.uAerialClose = { value: far?.close ?? far?.aerial ?? null };
    shader.uniforms.uHas = { value: new THREE.Vector2(far?.wide ? 1 : 0, far?.close ? 1 : 0) };
    shader.uniforms.uKeep = { value: new THREE.Vector4(...(far?.keep ?? [0, 0, 0, 0])) };
    shader.uniforms.uTurn = { value: new THREE.Vector2(Math.cos(AERIAL.turn), Math.sin(AERIAL.turn)) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vLawnAt;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvLawnAt = (modelMatrix * vec4(transformed, 1.0)).xz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uLawnMean;
        uniform sampler2D uAerial;
        uniform sampler2D uAerialWide;
        uniform sampler2D uAerialClose;
        uniform vec2 uHas;
        uniform vec4 uKeep;
        uniform vec2 uTurn;
        varying vec2 vLawnAt;
        // 1 well inside a photo, falling to 0 at its edge
        float lawnInside(vec2 at, float band) {
          vec2 e = min(at, 1.0 - at);
          return smoothstep(0.0, band, min(e.x, e.y));
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float lawnA = dot(texture2D(map, vMapUv * 0.171 + vec2(0.31, 0.17)).rgb, vec3(0.3333)) / uLawnMean;
        float lawnB = dot(texture2D(map, vMapUv * 0.047 + vec2(0.57, 0.83)).rgb, vec3(0.3333)) / uLawnMean;
        {
          float lawnTone = smoothstep(0.7, 1.3, lawnA * 0.55 + lawnB * 0.45);
          diffuseColor.rgb *= mix(vec3(0.74, 0.82, 0.70), vec3(1.22, 1.15, 0.92), lawnTone);
        }
        ${
          far
            ? `{
          // metres east and north of the middle of the house, first in the house's own
          // directions, then in true compass directions
          vec2 rel = vec2(vLawnAt.x, -vLawnAt.y);
          vec2 en = vec2(rel.x * uTurn.x + rel.y * uTurn.y, rel.y * uTurn.x - rel.x * uTurn.y);
          vec2 at = vec2(
            (${AERIAL.px.toFixed(2)} + en.x / ${AERIAL.metres}) / ${AERIAL.size.toFixed(1)},
            1.0 - (${AERIAL.py.toFixed(2)} - en.y / ${AERIAL.metres}) / ${AERIAL.size.toFixed(1)}
          );
          vec2 atWide = 0.5 + en / ${AERIAL_WIDE_M.toFixed(1)};
          vec2 atClose = 0.5 + en / ${AERIAL_CLOSE_M.toFixed(3)};
          // The widest photo first, then the sharper ones over it where they reach.
          vec3 photo = texture2D(uAerial, clamp(at, 0.0, 1.0)).rgb;
          float reach = lawnInside(at, 0.07);
          vec3 wide = texture2D(uAerialWide, clamp(atWide, 0.0, 1.0)).rgb;
          photo = mix(photo, mix(wide, photo, reach), uHas.x);
          reach = mix(reach, lawnInside(atWide, 0.06), uHas.x);
          // (the sharpened copy came out a little less green and blue than the photo it was made from)
          vec3 close = texture2D(uAerialClose, clamp(atClose, 0.0, 1.0)).rgb * vec3(1.04, 1.2, 1.2);
          float sharp = lawnInside(atClose, 0.14) * uHas.y;
          photo = mix(photo, close, sharp);
          // Distance outside the modelled garden (negative inside it). The handover runs over up
          // to 8 m and its line wanders by a couple of metres, so it does not read as a rectangle.
          vec2 out2 = max(vec2(uKeep.x - rel.x, uKeep.z - rel.y), vec2(rel.x - uKeep.y, rel.y - uKeep.w));
          float away = length(max(out2, 0.0)) + min(max(out2.x, out2.y), 0.0);
          // Where the photo shows grass or trees the handover takes its full width. Where it shows
          // asphalt or a roof it is short, because pale grass faded over asphalt reads as speckle.
          float green = smoothstep(0.015, 0.09, photo.g - max(photo.r, photo.b));
          float w = smoothstep(-1.0, mix(1.5, 7.0, green), away + (lawnA * 0.5 + lawnB * 0.5 - 1.0) * 9.0 * green) * reach;
          // Beyond the sharpened middle the photo goes soft close to the camera. There the grain
          // of the lawn image is laid over it, so the ground keeps some texture from near by.
          float grain = dot(texture2D(map, vMapUv).rgb, vec3(0.3333)) / uLawnMean;
          diffuseColor.rgb = mix(diffuseColor.rgb, photo * 1.12 * mix(1.0, grain, 0.22 * (1.0 - sharp)), w);
        }`
            : ""
        }`,
      );
  };
  material.customProgramCacheKey = () => (far ? `patchy-lawn-aerial-${far.wide ? 1 : 0}${far.close ? 1 : 0}` : "patchy-lawn");
  material.needsUpdate = true;
}

/** Average colour and brightness of an image, as the renderer sees them. */
export function imageMean(img: CanvasImageSource) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  const sum = new THREE.Color(0, 0, 0);
  const px = new THREE.Color();
  for (let i = 0; i < d.length; i += 4) {
    px.setRGB(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, THREE.SRGBColorSpace);
    sum.r += px.r;
    sum.g += px.g;
    sum.b += px.b;
  }
  const n = d.length / 4;
  const color = new THREE.Color(sum.r / n, sum.g / n, sum.b / n);
  return { color, luminance: (color.r + color.g + color.b) / 3 };
}

// A small repeatable random source, so the lawn and trees look the same on every visit.
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tufts of grass standing on the lawn near the house. Each tuft is five thin blades.
 * They matter up close (door views, the opening view); from far away they are hidden.
 */
export function grassTufts(opts: {
  count: number;
  area: [number, number, number, number]; // plan x0, y0, x1, y1
  isLawn: (x: number, y: number) => boolean;
  place: (x: number, y: number) => THREE.Vector3; // plan position on the ground, in scene coordinates
  color: THREE.Color;
}) {
  const rnd = seeded(7);
  const BLADES = 5;
  const pos: number[] = [];
  const col: number[] = [];
  const nor: number[] = [];
  for (let i = 0; i < BLADES; i++) {
    const ang = (i / BLADES) * Math.PI * 2 + rnd();
    const r = 0.012 + rnd() * 0.03;
    const bx = Math.cos(ang) * r;
    const bz = Math.sin(ang) * r;
    const h = 0.04 + rnd() * 0.035;
    const w = 0.006 + rnd() * 0.004;
    const lean = 0.012 + rnd() * 0.025;
    // a blade: two base points and a tip that leans outwards
    pos.push(bx - Math.sin(ang) * w, 0, bz + Math.cos(ang) * w);
    pos.push(bx + Math.sin(ang) * w, 0, bz - Math.cos(ang) * w);
    pos.push(bx + Math.cos(ang) * lean, h, bz + Math.sin(ang) * lean);
    col.push(0.82, 0.86, 0.78, 0.82, 0.86, 0.78, 1.18, 1.18, 1.0); // a little darker at the root, lighter at the tip
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0); // lit like the ground it stands on
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color,
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, opts.count);
  const [x0, y0, x1, y1] = opts.area;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const tint = new THREE.Color();
  let placed = 0;
  for (let tries = 0; placed < opts.count && tries < opts.count * 4; tries++) {
    const x = x0 + rnd() * (x1 - x0);
    const y = y0 + rnd() * (y1 - y0);
    if (!opts.isLawn(x, y)) continue;
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    const k = 0.75 + rnd() * 0.75;
    s.set(k, k * (0.8 + rnd() * 0.5), k);
    m.compose(opts.place(x, y), q, s);
    mesh.setMatrixAt(placed, m);
    const v = 0.85 + rnd() * 0.35;
    mesh.setColorAt(placed, tint.setRGB(v, v * (0.95 + rnd() * 0.1), v * 0.9));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return { mesh, dispose: () => (geo.dispose(), mat.dispose()) };
}

// ---------------------------------------------------------------------------
// Trees: a spruce (tiers of drooping branches) and a broad-leaved tree (a few
// lumpy crowns). Simple shapes, but with uneven outlines and shading from dark
// inside to light outside, so they do not read as cones and balls.
// ---------------------------------------------------------------------------
function lumpy(
  source: THREE.BufferGeometry,
  rnd: () => number,
  amount: number,
  inner: THREE.Color,
  outer: THREE.Color,
  sideways: boolean, // true: only push in and out sideways (tiers of a spruce); false: in every direction
) {
  // Shared points are joined first, so the surface stays closed and shades smoothly.
  const stripped = source.clone();
  stripped.deleteAttribute("uv");
  stripped.deleteAttribute("normal");
  const geo = mergeVertices(stripped, 1e-4);
  stripped.dispose();
  source.dispose();
  const pos = geo.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const size = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, 1e-6);
  // a few overlapping waves with random phases: smooth bumps of different sizes
  const ph = Array.from({ length: 9 }, () => rnd() * Math.PI * 2);
  const bump = (x: number, y: number, z: number) =>
    0.55 * Math.sin(x * 5.1 + ph[0]) * Math.sin(y * 4.3 + ph[1]) * Math.sin(z * 4.7 + ph[2]) +
    0.3 * Math.sin(x * 11.3 + ph[3]) * Math.sin(y * 9.1 + ph[4]) * Math.sin(z * 10.7 + ph[5]) +
    0.15 * Math.sin(x * 23.0 + ph[6]) * Math.sin(y * 19.0 + ph[7]) * Math.sin(z * 21.0 + ph[8]);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const b = bump(v.x / size, v.y / size, v.z / size); // about -1..1
    const f = 1 + b * amount * 2;
    const t = (v.y - box.min.y) / Math.max(1e-6, box.max.y - box.min.y);
    if (sideways) {
      v.x *= f;
      v.z *= f;
    } else {
      v.multiplyScalar(f);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
    // darker in the hollows and low down, lighter on the bumps and towards the top
    c.copy(inner).lerp(outer, Math.min(1, Math.max(0, 0.2 + 0.5 * t + 0.6 * b)));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

export function buildTree(kind: "spruce" | "leafy", height: number, seed: number, foliage: THREE.Texture | null) {
  const rnd = seeded(seed);
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const leaves = new THREE.MeshStandardMaterial({
    map: foliage ?? undefined,
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    side: kind === "spruce" ? THREE.DoubleSide : THREE.FrontSide,
  });
  const bark = new THREE.MeshStandardMaterial({ color: "#6b5645", roughness: 1 });
  disposables.push(leaves, bark);
  const add = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    disposables.push(mesh.geometry);
    group.add(mesh);
  };
  if (kind === "spruce") {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.012, height * 0.03, height * 0.5, 8), bark);
    trunk.position.y = height * 0.25;
    add(trunk);
    const tiers = 13;
    const inner = new THREE.Color("#16291f");
    const outer = new THREE.Color("#3f6248");
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1); // 0 at the bottom, 1 at the top
      const r = height * (0.2 - 0.17 * t) * (0.85 + rnd() * 0.3);
      const h = height * (0.26 - 0.1 * t);
      const geo = lumpy(new THREE.ConeGeometry(r, h, 22, 5, true), rnd, 0.17, inner, outer, true);
      const cone = new THREE.Mesh(geo, leaves);
      cone.position.y = height * (0.16 + 0.76 * t) + h * 0.2;
      cone.rotation.set((rnd() - 0.5) * 0.12, rnd() * Math.PI, (rnd() - 0.5) * 0.12);
      add(cone);
    }
  } else {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.03, height * 0.045, height * 0.5, 8), bark);
    trunk.position.y = height * 0.25;
    add(trunk);
    const inner = new THREE.Color("#2f4a2a");
    const outer = new THREE.Color("#86a05a");
    const crowns = 5;
    for (let i = 0; i < crowns; i++) {
      const r = height * (i === 0 ? 0.3 : 0.17 + rnd() * 0.08);
      const geo = lumpy(new THREE.IcosahedronGeometry(r, 4), rnd, 0.11, inner, outer, false);
      const blob = new THREE.Mesh(geo, leaves);
      const ang = rnd() * Math.PI * 2;
      const out = i === 0 ? 0 : height * (0.14 + rnd() * 0.1);
      blob.position.set(Math.cos(ang) * out, height * (i === 0 ? 0.66 : 0.52 + rnd() * 0.26), Math.sin(ang) * out);
      blob.scale.y = 0.8 + rnd() * 0.25;
      add(blob);
    }
  }
  return { group, dispose: () => disposables.forEach((d) => d.dispose()) };
}

/**
 * The edge of the forest north of the house: one simple spruce, drawn many times along a
 * line, each copy turned, sized and tinted a little differently. The ground climbs behind
 * the first row, as the hillside does.
 */
export function spruceBelt(opts: {
  edge: [number, number][]; // plan points along the forest edge, west to east
  count: number;
  depth: number; // metres into the forest
  place: (x: number, y: number, lift: number) => THREE.Vector3;
}) {
  const rnd = seeded(41);
  const inner = new THREE.Color("#132419");
  const outer = new THREE.Color("#3b5c42");
  const tiers = 11;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const r = (0.135 - 0.115 * t) * (0.82 + rnd() * 0.36);
    const h = 0.24 - 0.1 * t;
    const cone = lumpy(new THREE.ConeGeometry(r, h, 12, 2, true), rnd, 0.24, inner, outer, true);
    cone.rotateY(rnd() * Math.PI);
    cone.translate((rnd() - 0.5) * 0.012, 0.12 + 0.76 * t + h * 0.15, (rnd() - 0.5) * 0.012);
    parts.push(cone);
  }
  const geo = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, opts.count);
  // lengths along the edge, to spread the trees evenly
  const seg = opts.edge.slice(1).map(([x, y], i) => Math.hypot(x - opts.edge[i][0], y - opts.edge[i][1]));
  const total = seg.reduce((p, q) => p + q, 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const tint = new THREE.Color();
  const placed: { at: THREE.Vector3; turn: THREE.Quaternion; size: THREE.Vector3 }[] = [];
  for (let n = 0; n < opts.count; n++) {
    let along = ((n + rnd()) / opts.count) * total;
    let i = 0;
    while (i < seg.length - 1 && along > seg[i]) along -= seg[i++];
    const [ax, ay] = opts.edge[i];
    const [bx, by] = opts.edge[i + 1];
    const f = along / seg[i];
    const deep = Math.pow(rnd(), 1.4) * opts.depth;
    // into the forest: to the left of the direction of travel (north, going east)
    const nx = -(by - ay) / seg[i];
    const ny = (bx - ax) / seg[i];
    const x = ax + (bx - ax) * f + nx * deep + (rnd() - 0.5) * 3;
    const y = ay + (by - ay) * f + ny * deep;
    const height = 19 + rnd() * 11;
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    s.set(height * (0.85 + rnd() * 0.35), height, height * (0.85 + rnd() * 0.35));
    const at = opts.place(x, y, deep * 0.32);
    m.compose(at, q, s);
    mesh.setMatrixAt(n, m);
    placed.push({ at, turn: q.clone(), size: s.clone() });
    const v = 0.8 + rnd() * 0.4;
    mesh.setColorAt(n, tint.setRGB(v, v * (0.96 + rnd() * 0.1), v * 0.92));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  // On a narrow screen the free view stands far back, among these trees. Trees close to the
  // camera shrink away, so none of them stands between the camera and the house.
  const seen = new THREE.Vector3(Infinity, 0, 0);
  const clear = (camera: THREE.Vector3) => {
    if (camera.distanceToSquared(seen) < 1) return;
    seen.copy(camera);
    placed.forEach((tree, n) => {
      const away = Math.hypot(camera.x - tree.at.x, camera.z - tree.at.z);
      const k = Math.min(1, Math.max(0, (away - 42) / 16));
      m.compose(tree.at, tree.turn, s.copy(tree.size).multiplyScalar(k * k * (3 - 2 * k)));
      mesh.setMatrixAt(n, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { mesh, clear, dispose: () => (geo.dispose(), mat.dispose()) };
}
