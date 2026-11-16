"use client";

import { useEffect, useState, type ReactNode } from "react";
import { House3D } from "./House3D";

// The interactive 3D "virtual visit" as a full-screen pop-out that can be opened
// from anywhere (hero, a section, or the nav). A single <VisitOverlay /> is mounted
// in the layout and listens for an event; <VisitButton> (or openVirtualVisit) fires it.
const OPEN_EVENT = "open-virtual-visit";

export function openVirtualVisit() {
  window.dispatchEvent(new Event(OPEN_EVENT));
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

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Virtual visit"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-0 sm:p-4"
    >
      <div className="relative h-full w-full overflow-hidden bg-cream shadow-soft sm:h-[92vh] sm:max-w-6xl sm:rounded-3xl">
        {/* Mounted fresh each time the pop-out opens; straight to the 3D model. */}
        <House3D hideChrome instant />

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close virtual visit"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-forest/90 text-lg text-cream shadow-soft transition hover:bg-pine"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
