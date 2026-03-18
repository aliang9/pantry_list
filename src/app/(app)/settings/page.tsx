"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
  localStorage.setItem("theme", theme);
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    setTheme(getStoredTheme());
  }, [supabase.auth]);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="px-4 pt-safe-top">
      <h1 className="text-2xl font-bold py-6 text-gray-900 dark:text-white">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Account */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Account
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Signed in as
            </p>
            <p className="text-gray-900 dark:text-white font-medium mt-1">
              {email ?? "Loading..."}
            </p>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Appearance
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            {(["system", "light", "dark"] as Theme[]).map((option) => (
              <button
                key={option}
                onClick={() => handleThemeChange(option)}
                className={`w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-left border-b last:border-b-0 border-gray-200 dark:border-gray-800 transition-colors ${
                  theme === option
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <span className="capitalize">{option}</span>
                {theme === option && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl text-base min-h-[44px] transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Sign out
          </button>
        </div>

        {/* About */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-4">
          Pantry Assistant v1.0.0
        </div>
      </div>
    </div>
  );
}
