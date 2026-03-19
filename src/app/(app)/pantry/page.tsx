"use client";

import { useState, useMemo } from "react";
import { usePantry } from "@/hooks/usePantry";
import PantryItemCard from "@/components/pantry/PantryItemCard";
import PantryAddSheet from "@/components/pantry/PantryAddSheet";
import PantryEditSheet from "@/components/pantry/PantryEditSheet";
import type { PantryItem, PantryCategory } from "@/types/pantry";

const categories: PantryCategory[] = [
  "produce",
  "dairy",
  "protein",
  "pantry",
  "spice",
  "other",
];

function PantrySkeleton() {
  return (
    <div className="space-y-6 mt-2">
      {["Produce", "Protein", "Pantry"].map((label) => (
        <div key={label}>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PantryPage() {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePantry();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<PantryCategory | null>(
    null
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);

  const grouped = useMemo(() => {
    const filtered = items.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filterCategory && item.category !== filterCategory) {
        return false;
      }
      return true;
    });

    return filtered.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, PantryItem[]>
    );
  }, [items, search, filterCategory]);

  const totalFiltered = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="px-4 pt-safe-top">
      <h1 className="text-2xl font-bold py-6 text-gray-900 dark:text-white">
        Pantry
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
      />

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[36px] transition-all ${
            filterCategory === null
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFilterCategory(filterCategory === cat ? null : cat)
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[36px] transition-all capitalize ${
              filterCategory === cat
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items list */}
      {isLoading ? (
        <PantrySkeleton />
      ) : totalFiltered === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-lg">No items found</p>
          <p className="text-sm mt-1">
            Add items using the + button or chat with your assistant
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-2">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} className="animate-fade-in">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {category}
              </h2>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <PantryItemCard
                    key={item.id}
                    item={item}
                    onEdit={setEditItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-all active:scale-95 z-40"
      >
        +
      </button>

      <PantryAddSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addItem}
      />

      <PantryEditSheet
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
      />
    </div>
  );
}
