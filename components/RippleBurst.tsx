"use client";

export function RippleBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="ripple-ring absolute aspect-square w-[min(70vw,260px)] rounded-full border border-cyan-200/35"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
