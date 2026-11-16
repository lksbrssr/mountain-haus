"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/Chrome";
import { house } from "@/lib/house";
import { createHouseScene, type SceneHandle, type ViewMode } from "./scene";

// Three ways in:
//  - /visit page: opens on the landing-page photo, laid out exactly as on the landing
//    page, with the 3D view lined up underneath. The photo fades and the camera pulls back.
//  - `instant`: straight to the 3D model (shared ?visit links, other pages).
//  - `flyFrom`: the house, cut out of the landing-page photo, lifts off the page, shrinks
//    into this view, lands exactly where the 3D model shows the house from the photo's
//    viewpoint, and dissolves into the model. Then the camera pulls back.
type Phase = "photo" | "fading" | "model";
const HOLD_MS = 450;
const FADE_MS = 2200;

/** A rectangle in viewport pixels. */
export type Rect = { left: number; top: number; width: number; height: number };

// The cut-out is the whole photo frame with everything but the house transparent: a JPEG
// for the colours and a PNG whose alpha is the shape of the house.
export const CUTOUT = { image: "/house3d/cutout.jpg", mask: "/house3d/cutout-mask.png", w: 1871, h: 1041 };
const FLY_MS = 1100; // the house travels from the page into the pop-up
const MORPH_MS = 800; // the cut-out dissolves into the 3D model
const PULL_MS = 2600; // the camera pulls back to the free view

const loadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
/** Fetch the cut-out ahead of time, so the flight can start the moment it is asked for. */
export const preloadCutout = () => Promise.all([loadImage(CUTOUT.image), loadImage(CUTOUT.mask)]);

/** Where the full photo frame sits on screen, given the hero box that shows it cropped. */
export function heroPhotoRect(): Rect | null {
  const el = document.querySelector<HTMLElement>("[data-visit-hero]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.bottom < 160 || r.top > window.innerHeight - 160) return null; // not really on screen
  // object-cover with object-position: center 28%
  const s = Math.max(r.width / CUTOUT.w, r.height / CUTOUT.h);
  return {
    left: r.left + (r.width - CUTOUT.w * s) * 0.5,
    top: r.top + (r.height - CUTOUT.h * s) * 0.28,
    width: CUTOUT.w * s,
    height: CUTOUT.h * s,
  };
}

export function House3D({
  hideChrome = false,
  instant = false,
  flyFrom = null,
}: { hideChrome?: boolean; instant?: boolean; flyFrom?: Rect | null } = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [mode, setMode] = useState<ViewMode | null>(null);
  const [phase, setPhase] = useState<Phase>("photo");
  const [photoReady, setPhotoReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [touch, setTouch] = useState(false);
  const [flying, setFlying] = useState(!!flyFrom);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fly = !!flyFrom && !reduced && !!frameRef.current && !!cutRef.current;
    const still = !fly && (instant || !!flyFrom || reduced);

    // Flight: place the landing frame first, because the scene lines its opening view up with it.
    const frame = frameRef.current;
    if (fly && frame) {
      const box = host.getBoundingClientRect();
      const aspect = CUTOUT.w / CUTOUT.h;
      const w = Math.min(box.width * 0.86, box.height * 0.62 * aspect);
      frame.style.width = `${w}px`;
      frame.style.height = `${w / aspect}px`;
      frame.style.left = `${(box.width - w) / 2}px`;
      frame.style.top = `${(box.height - w / aspect) * 0.4}px`;
    }

    const scene = createHouseScene(host, {
      photo: still ? null : fly ? frame : photoRef.current,
      onMode: setMode,
    });
    sceneRef.current = scene;
    scene.ready.then(() => setModelReady(true));
    if (still) {
      setFlying(false);
      setPhase("model");
      setMode("orbit");
    }

    let cancelled = false;
    const cut = cutRef.current;
    if (fly && frame && cut && flyFrom) {
      const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      const land = frame.getBoundingClientRect();
      // The cut-out sits at its landing place and is transformed back to where the photo is.
      cut.style.left = `${land.left}px`;
      cut.style.top = `${land.top}px`;
      cut.style.width = `${land.width}px`;
      cut.style.height = `${land.height}px`;
      const k = flyFrom.width / land.width;
      const start = `translate(${flyFrom.left - land.left}px, ${flyFrom.top - land.top}px) scale(${k})`;
      cut.style.transform = start;
      host.style.opacity = "0";
      (async () => {
        try {
          await Promise.race([preloadCutout(), wait(2500).then(() => Promise.reject(new Error("slow")))]);
          if (cancelled) return;
          cut.style.opacity = "1";
          // The photo on the page is darkened by its gradient, so the cut-out starts a little
          // darker and brightens on the way.
          await cut.animate(
            [
              { transform: start, filter: "brightness(0.82)" },
              { transform: "none", filter: "brightness(1)" },
            ],
            { duration: FLY_MS, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
          ).finished;
          await scene.ready;
          if (cancelled) return;
          // Landed: the 3D model is underneath, seen from the same spot. Dissolve into it.
          host.style.transition = `opacity ${MORPH_MS}ms ease-in-out`;
          host.style.opacity = "1";
          cut.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: MORPH_MS,
            easing: "ease-in-out",
            fill: "forwards",
          });
          await wait(MORPH_MS * 0.6);
          if (cancelled) return;
          scene.reveal(PULL_MS);
          await wait(MORPH_MS * 0.4);
        } catch {
          // Cut-out missing or too slow: skip the flight and show the model.
          host.style.opacity = "1";
          scene.reveal(600);
        }
        if (cancelled) return;
        setFlying(false);
        setPhase("model");
      })();
    }

    return () => {
      cancelled = true;
      scene.dispose();
      sceneRef.current = null;
    };
    // Runs once per opening: the pop-out mounts this fresh every time.
  }, []);

  // If the photo never arrives, carry on without it.
  useEffect(() => {
    const t = setTimeout(() => setPhotoReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // /visit page: once the photo is on screen, hold a moment, fade it, then move the camera.
  useEffect(() => {
    if (flyFrom || !photoReady || !modelReady || phase !== "photo") return;
    const t = setTimeout(() => setPhase("fading"), HOLD_MS);
    return () => clearTimeout(t);
  }, [flyFrom, photoReady, modelReady, phase]);
  useEffect(() => {
    if (phase !== "fading") return;
    const t = setTimeout(() => {
      setPhase("model");
      sceneRef.current?.reveal();
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const hint =
    mode === "door"
      ? "drag to look around"
      : touch
        ? "drag to rotate · pinch to zoom · tap a door"
        : "drag to rotate · scroll to zoom · double-click to reset · click a door";

  return (
    <div className="relative h-full min-h-[560px] w-full select-none overflow-hidden bg-cream">
      {/* The 3D view stays hidden until the photo is up, so the photo is always what you see first. */}
      <div
        ref={hostRef}
        className={`absolute inset-0 ${!flyFrom && phase === "photo" && !photoReady ? "opacity-0" : "opacity-100"}`}
      />

      {flyFrom ? (
        <>
          {/* where the cut-out lands; the 3D view opens lined up with this frame */}
          <div ref={frameRef} aria-hidden className="pointer-events-none absolute" />
          {flying && (
            <div
              ref={cutRef}
              aria-hidden
              className="pointer-events-none fixed z-[120] opacity-0"
              style={{
                transformOrigin: "0 0",
                willChange: "transform, opacity",
                backgroundImage: `url(${CUTOUT.image})`,
                backgroundSize: "100% 100%",
                WebkitMaskImage: `url(${CUTOUT.mask})`,
                maskImage: `url(${CUTOUT.mask})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
            />
          )}
        </>
      ) : (
        phase !== "model" && (
          <div
            ref={photoRef}
            className="pointer-events-none absolute inset-x-0 top-0 h-[92vh] min-h-[560px] transition-opacity ease-in-out"
            style={{ opacity: phase === "photo" ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
          >
            <Image
              src={house.heroImage}
              alt=""
              fill
              priority
              className="object-cover object-[center_28%]"
              onError={() => setPhotoReady(true)}
              onLoad={(e) => {
                // Wait until the photo can actually be painted before starting.
                const img = e.currentTarget;
                (img.decode ? img.decode() : Promise.resolve())
                  .catch(() => undefined)
                  .then(() => setPhotoReady(true));
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/70" />
          </div>
        )
      )}

      {!hideChrome && <SiteHeader light={phase === "photo"} />}

      {mode === "door" && (
        <button
          type="button"
          onClick={() => sceneRef.current?.back()}
          className="absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-full bg-forest px-4 py-2 text-sm text-cream shadow-soft transition hover:bg-pine"
        >
          ← Back to the house
        </button>
      )}
      <p
        className={`pointer-events-none absolute inset-x-0 bottom-5 px-6 text-center text-xs text-pine/80 transition-opacity duration-700 ${
          mode ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}
