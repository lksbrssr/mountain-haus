"use client";

import { useEffect, useState, type ReactNode } from "react";
import { House3D, heroPhotoRect, preloadCutout, type Rect } from "./House3D";

// The interactive 3D "virtual visit" as a full-screen pop-out that can be opened
// from anywhere (hero or nav). The open state is mirrored in the URL (?visit=1) so a
// visitor can copy the address and share a link that opens straight into the model.
// A single <VisitOverlay /> is mounted in the layout and reads the URL; opening it
// pushes the URL, closing it (or Back) removes it.
const PARAM = "visit";
const CHANGE_EVENT = "visitchange";

// Opened by a button while the landing-page photo is on screen, the house lifts out of that
// photo and flies into the pop-out (see House3D). `flyFrom` is where the photo sits at that
// moment. Shared links, Back/Forward and other pages open straight to the model.
let flyFrom: Rect | null = null;

const hasVisitParam = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has(PARAM);

export function openVirtualVisit() {
  if (hasVisitParam()) return;
  flyFrom = heroPhotoRect();
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, "1");
  window.history.pushState({ visit: true }, "", url);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function closeVirtualVisit() {
  if (!hasVisitParam()) return;
  // If we pushed the ?visit entry ourselves, go Back so the URL stays clean and the
  // browser's back button feels natural. Otherwise (opened directly from a shared
  // link) just strip the param in place.
  if (window.history.state?.visit) {
    window.history.back();
  } else {
    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM);
    window.history.replaceState({}, "", url);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function VisitButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={openVirtualVisit} className={className}>
      {children}
    </button>
  );
}

export function VisitOverlay() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Rect | null>(null);

  // Derive open state from the URL, on mount and on any change (Back/Forward too).
  useEffect(() => {
    const sync = () => {
      setFrom(flyFrom); // set only by a button press just now
      flyFrom = null;
      setOpen(hasVisitParam());
    };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVirtualVisit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fetch the cut-out of the house once the page has settled, so the flight starts at once.
  useEffect(() => {
    const t = setTimeout(() => void preloadCutout().catch(() => undefined), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Virtual visit"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-0 sm:p-4 ${from ? "visit-wait" : ""}`}
    >
      <div className="relative h-full w-full overflow-hidden bg-cream shadow-soft sm:h-[92vh] sm:max-w-6xl sm:rounded-3xl">
        {/* Mounted fresh each time the pop-out opens: with the flight when opened from the
            landing-page photo, otherwise straight to the 3D model. */}
        <House3D hideChrome instant={!from} flyFrom={from} />

        <button
          type="button"
          onClick={closeVirtualVisit}
          aria-label="Close virtual visit"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-forest/90 text-lg text-cream shadow-soft transition hover:bg-pine"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
