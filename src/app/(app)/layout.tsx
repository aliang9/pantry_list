"use client";

import { useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const tabOrder = ["/", "/pantry", "/recipes", "/settings"];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef({ x: 0, y: 0 });
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    directionLocked.current = null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diffX = e.changedTouches[0].clientX - touchStart.current.x;
      const diffY = e.changedTouches[0].clientY - touchStart.current.y;

      // Only trigger if horizontal and distance is significant
      if (Math.abs(diffX) < 80 || Math.abs(diffX) < Math.abs(diffY) * 1.5) {
        return;
      }

      const currentIdx = tabOrder.indexOf(pathname);
      if (currentIdx === -1) return;

      if (diffX < 0 && currentIdx < tabOrder.length - 1) {
        // Swipe left → next tab
        router.push(tabOrder[currentIdx + 1]);
      } else if (diffX > 0 && currentIdx > 0) {
        // Swipe right → previous tab
        router.push(tabOrder[currentIdx - 1]);
      }
    },
    [pathname, router]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main
        className="pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
