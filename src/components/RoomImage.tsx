import Image from "next/image";

// Renders a room photo if there is one, otherwise a tasteful "coming soon"
// placeholder. Always fills its (relative) parent container.
export function RoomImage({
  src,
  alt,
  sizes,
  priority,
  label = "Photo coming soon",
}: {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  label?: string;
}) {
  if (src) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sand to-clay/50">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #2f3e34 0 1px, transparent 1px 14px)",
        }}
      />
      <div className="relative text-center text-pine/60">
        <div className="text-3xl">⛰️</div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em]">{label}</p>
      </div>
    </div>
  );
}
