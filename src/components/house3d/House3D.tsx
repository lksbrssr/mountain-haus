"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/Chrome";
import { house } from "@/lib/house";
import { createHouseScene, type SceneHandle, type ViewMode } from "./scene";

// The page opens on the landing-page photo, laid out exactly as on the landing
// page, with the 3D view lined up underneath. The photo then fades away and the
// camera pulls back.
type Phase = "photo" | "fading" | "model";
const HOLD_MS = 450;
const FADE_MS = 2200;

export function House3D({ hideChrome = false }: { hideChrome?: boolean } = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [mode, setMode] = useState<ViewMode | null>(null);
  const [phase, setPhase] = useState<Phase>("photo");
  const [photoReady, setPhotoReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = createHouseScene(host, { photo: still ? null : photoRef.current, onMode: setMode });
    sceneRef.current = scene;
    scene.ready.then(() => setModelReady(true));
    if (still) {
      setPhase("model");
      setMode("orbit");
    }
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // If the photo never arrives, carry on without it.
  useEffect(() => {
    const t = setTimeout(() => setPhotoReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Once the photo is on screen: hold a moment, fade it, then move the camera.
  useEffect(() => {
    if (!photoReady || !modelReady || phase !== "photo") return;
    const t = setTimeout(() => setPhase("fading"), HOLD_MS);
    return () => clearTimeout(t);
  }, [photoReady, modelReady, phase]);
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
        className={`absolute inset-0 ${phase === "photo" && !photoReady ? "opacity-0" : "opacity-100"}`}
      />

      {phase !== "model" && (
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
