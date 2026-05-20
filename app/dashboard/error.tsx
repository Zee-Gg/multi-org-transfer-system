"use client";

import React from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Dashboard error boundary - handles errors in dashboard pages
 */
export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    console.error("[Dashboard Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[500px] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2h2m-2 0h-2m8-10a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Dashboard Error</h2>
              <p className="text-sm text-amber-700 mb-4">
                We encountered an error loading this dashboard. Please try refreshing or navigating back.
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mb-4">
                  <summary className="text-xs text-amber-600 cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-2 text-xs bg-amber-100 p-2 rounded overflow-auto max-h-32 text-amber-800">
                    {error.message}
                    {"\n"}
                    {error.stack?.split("\n").slice(0, 5).join("\n")}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="inline-flex items-center px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
                >
                  Try again
                </button>
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-3 py-2 bg-slate-200 text-slate-900 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors"
                >
                  Back to dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
