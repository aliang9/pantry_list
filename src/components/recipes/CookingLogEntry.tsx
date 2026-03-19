"use client";

import { memo } from "react";
import type { CookingLog } from "@/types/recipe";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

interface CookingLogEntryProps {
  log: CookingLog;
}

function CookingLogEntryInner({ log }: CookingLogEntryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {log.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {formatDate(log.cooked_at)}
          </p>
        </div>
        {log.rating && (
          <div className="ml-3 shrink-0">
            <Stars rating={log.rating} />
          </div>
        )}
      </div>
      {log.notes && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
          {log.notes}
        </p>
      )}
      {log.recipe && (
        <div className="mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Saved recipe
          </span>
        </div>
      )}
    </div>
  );
}

const CookingLogEntry = memo(CookingLogEntryInner);
CookingLogEntry.displayName = "CookingLogEntry";

export default CookingLogEntry;
