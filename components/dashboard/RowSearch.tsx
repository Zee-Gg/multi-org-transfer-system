"use client";
import { useState, useCallback, useEffect } from "react";

interface Props {
  onSearch: (query: string) => void;
  loading?: boolean;
  resultCount?: number;
}

export default function RowSearch({ onSearch, loading = false, resultCount }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query (wait for user to stop typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 800);

    return () => clearTimeout(timer);
  }, [query]);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <div className="mb-6">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rows by field values..."
          disabled={loading}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
        />

        {query && (
          <button
            onClick={handleClear}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search result info */}
      {query && (
        <div className="mt-2 text-xs text-slate-500">
          {loading ? (
            <span>Searching...</span>
          ) : resultCount !== undefined ? (
            <span>
              Found <span className="font-semibold text-slate-700">{resultCount.toLocaleString()}</span> result
              {resultCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
