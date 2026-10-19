import type { ReactNode } from "react";

// Floating action bar (save, cancel...) that stays at the bottom of the screen while a long form scrolls. Gray with a strong shadow, so it does not blend with the page
export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-card border border-line bg-media px-5 py-3 shadow-[0_10px_40px_#23233933]">
      {children}
    </div>
  );
}
