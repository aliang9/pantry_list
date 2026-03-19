"use client";

import { memo, useRef, useState } from "react";
import type { PantryItem } from "@/types/pantry";

const categoryColors: Record<string, string> = {
  produce: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dairy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  protein: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pantry: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  spice: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
}

function PantryItemCardInner({
  item,
  onEdit,
  onDelete,
}: PantryItemCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const swiping = useRef(false);

  const isExpiringSoon =
    item.expiration_date &&
    new Date(item.expiration_date).getTime() - Date.now() <
      3 * 24 * 60 * 60 * 1000;

  const isExpired =
    item.expiration_date &&
    new Date(item.expiration_date).getTime() < Date.now();

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping.current) return;
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) {
      setSwipeX(Math.max(diff, -80));
    }
  }

  function handleTouchEnd() {
    swiping.current = false;
    if (swipeX < -50) {
      setSwipeX(-80);
    } else {
      setSwipeX(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm">
      {/* Delete button behind */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-500 text-white h-full px-6 font-medium min-w-[44px] min-h-[44px] flex items-center"
        >
          Delete
        </button>
      </div>

      {/* Card content */}
      <div
        className={`relative bg-white dark:bg-gray-900 p-4 transition-transform ${
          isExpired
            ? "border-l-4 border-red-500"
            : isExpiringSoon
              ? "border-l-4 border-amber-400"
              : ""
        }`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => swipeX === 0 && onEdit(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {item.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {item.quantity} {item.unit}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-3">
            {isExpired && (
              <span className="text-xs font-medium bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                Expired
              </span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                Expiring
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                categoryColors[item.category] ?? categoryColors.other
              }`}
            >
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PantryItemCard = memo(PantryItemCardInner);
PantryItemCard.displayName = "PantryItemCard";

export default PantryItemCard;
