"use client";

import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import type { PantryItem, PantryCategory } from "@/types/pantry";

const categories: PantryCategory[] = [
  "produce",
  "dairy",
  "protein",
  "pantry",
  "spice",
  "other",
];

interface PantryEditSheetProps {
  item: PantryItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      name?: string;
      category?: PantryCategory;
      quantity?: number;
      unit?: string;
      expiration_date?: string | null;
    }
  ) => Promise<void>;
}

export default function PantryEditSheet({
  item,
  onClose,
  onSave,
}: PantryEditSheetProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<PantryCategory>(
    item?.category ?? "other"
  );
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "unit");
  const [expirationDate, setExpirationDate] = useState(
    item?.expiration_date ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      await onSave(item.id, {
        name,
        category,
        quantity: parseFloat(quantity) || 1,
        unit,
        expiration_date: expirationDate || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={!!item} onClose={onClose} maxHeight="80vh">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Edit item
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PantryCategory)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="any"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expiration date (optional)
          </label>
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl text-base min-h-[44px] transition-colors"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </BottomSheet>
  );
}
