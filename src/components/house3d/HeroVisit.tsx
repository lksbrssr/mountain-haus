"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/Chrome";
import { house } from "@/lib/house";
import { getRoom } from "@/lib/rooms";
import type { RoomHover, SceneHandle, ViewMode } from "./scene";

// The landing-page hero. While the visitor scrolls, the page stays pinned and the scroll
// position drives the picture instead: the text leaves, the photo dissolves into the 3D
// model seen from the same spot, and the camera pulls back until the model can be dragged.
// The page catches at that point (a scroll snap), and scrolling on releases it.
const RUNWAY_VH = 110; // scrolling that turns the photo into the free 3D view
const HOLD_VH = 40; // extra scrolling the model stays put for, before the page moves on

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (from: number, to: number, v: number) => {
  const u = clamp01((v - from) / (to - from));
  return u * u * (3 - 2 * u);
};

export function HeroVisit({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [enabled, setEnabled] = useState(true); // false = plain photo hero, no 3D
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<ViewMode | null>(null);
  const [light, setLight] = useState(true);
  const [touch, setTouch] = useState(false);
  const [hover, setHover] = useState<RoomHover | null>(null);
  const router = useRouter();

  // Load the 3D scene after the page is up, so the hero photo is never held back by it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnabled(false);
      return;
    }
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    let cancelled = false;
    let scene: SceneHandle | null = null;
    import("./scene")
      .then(({ createHouseScene }) => {
        if (cancelled || !hostRef.current) return;
        scene = createHouseScene(hostRef.current, {
          photo: photoRef.current,
          onMode: setMode,
          onHover: setHover,
          onOpen: (slug) => router.push(`/rooms/${slug}`),
          scrollDriven: true,
          embedded: true,
        });
        scene.setActive(false);
        sceneRef.current = scene;
        return scene.ready.then(() => {
          if (!cancelled) setReady(true);
        });
      })
      .catch(() => {
        if (!cancelled) setEnabled(false); // no WebGL, or the scene failed: keep the photo
      });
    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // The page catches where the model becomes draggable.
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const before = root.style.scrollSnapType;
    root.style.scrollSnapType = "y proximity";
    return () => {
      root.style.scrollSnapType = before;
    };
  }, [enabled]);

  // Scroll position → what is on screen.
  useEffect(() => {
    const on = enabled && ready;
    let queued = 0;
    const update = () => {
      queued = 0;
      const wrap = wrapRef.current;
      const photo = photoRef.current;
      const host = hostRef.current;
      const text = textRef.current;
      if (!wrap || !photo || !host || !text) return;
      const box = wrap.getBoundingClientRect();
      const p = on ? clamp01(-box.top / ((window.innerHeight * RUNWAY_VH) / 100)) : 0;
      const photoOpacity = 1 - ramp(0.06, 0.5, p);
      photo.style.opacity = String(photoOpacity);
      host.style.opacity = on && p > 0 ? "1" : "0";
      text.style.opacity = String(1 - ramp(0, 0.14, p));
      text.style.transform = `translateY(${-40 * ramp(0, 0.2, p)}px)`;
      text.style.pointerEvents = p > 0.08 ? "none" : "";
      const scene = sceneRef.current;
      scene?.setActive(on && p > 0 && box.bottom > 0);
      scene?.setProgress(on ? clamp01((p - 0.35) / 0.65) : 0);
      setLight(photoOpacity > 0.5);
    };
    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, ready]);

  const hoverRoom = hover ? getRoom(hover.slug) : undefined;
  const hint =
    mode === "door"
      ? "drag to look around"
      : touch
        ? "drag to rotate · tap a room marker"
        : "drag to rotate · double-click to reset · hover a room marker";

  return (
    <section
      ref={wrapRef}
      className="relative"
      style={enabled ? { height: `calc(100svh + ${RUNWAY_VH + HOLD_VH}vh)` } : undefined}
    >
      {enabled && (
        // where the page catches: the model is fully revealed here
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `${RUNWAY_VH}vh`, scrollSnapAlign: "start" }}
        />
      )}
      <div
        className={
          enabled
            ? "sticky top-0 h-[100svh] min-h-[560px] w-full overflow-hidden"
            : "relative h-[92vh] min-h-[560px] w-full overflow-hidden"
        }
      >
        <div ref={hostRef} className="absolute inset-0 select-none opacity-0" />

        <div ref={photoRef} className="pointer-events-none absolute inset-x-0 top-0 h-[92vh] min-h-[560px]">
          <Image src={house.heroImage} alt={house.name} fill priority className="object-cover object-[center_28%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/70" />
        </div>

        {hoverRoom && hover && (
          <div
            className="pointer-events-none absolute z-30 w-60"
            style={{ left: hover.x, top: hover.y, transform: "translate(-50%, calc(-100% - 20px))" }}
          >
            <div className="overflow-hidden rounded-2xl bg-cream shadow-soft ring-1 ring-ink/10">
              <div className="flex gap-0.5">
                {hoverRoom.images.length > 0 ? (
                  hoverRoom.images.slice(0, 2).map((src) => (
                    <div key={src} className="relative h-28 flex-1">
                      <Image src={src} alt="" fill sizes="240px" className="object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="flex h-28 flex-1 items-center justify-center bg-sand text-xs text-pine">
                    Photo coming soon
                  </div>
                )}
              </div>
              <div className="px-3 py-2">
                <p className="font-display text-sm text-ink">{hoverRoom.name}</p>
                <p className="mt-0.5 text-xs leading-snug text-pine">{hoverRoom.short}</p>
              </div>
            </div>
          </div>
        )}

        <SiteHeader light={light} />

        <div
          ref={textRef}
          className="absolute inset-x-0 top-0 z-20 flex h-[92vh] min-h-[560px] flex-col justify-end px-6 pb-16"
        >
          {children}
        </div>

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
          className={`pointer-events-none absolute inset-x-0 bottom-5 px-6 text-center text-xs text-pine/80 transition-opacity duration-500 ${
            mode ? "opacity-100" : "opacity-0"
          }`}
        >
          {hint}
        </p>
      </div>
    </section>
  );
}
