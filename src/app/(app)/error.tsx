"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 text-red-600 dark:text-red-400"
        >
          <path
            fillRule="evenodd"
            d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl min-h-[44px] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
