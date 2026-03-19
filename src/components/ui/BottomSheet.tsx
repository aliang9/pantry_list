"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({
  open,
  onClose,
  children,
  maxHeight = "85vh",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStart = useRef({ y: 0, time: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag from the handle area or when scrolled to top
    const scrollEl = scrollRef.current;
    const isAtTop = !scrollEl || scrollEl.scrollTop <= 0;
    const touchY = e.touches[0].clientY;
    const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? 0;
    const isNearHandle = touchY - sheetTop < 40;

    if (isAtTop || isNearHandle) {
      touchStart.current = { y: e.touches[0].clientY, time: Date.now() };
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const diff = e.touches[0].clientY - touchStart.current.y;
      // Only drag downward
      if (diff > 0) {
        setDragY(diff);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const elapsed = Date.now() - touchStart.current.time;
    const velocity = dragY / elapsed;

    // Dismiss if dragged far enough or fast enough
    if (dragY > 100 || velocity > 0.5) {
      onClose();
    }
    setDragY(0);
  }, [isDragging, dragY, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        style={{ opacity: isDragging ? 1 - dragY / 400 : undefined }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl animate-slide-up"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
          maxHeight,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          style={{ maxHeight: `calc(${maxHeight} - 2rem)` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
