"use client";

import React from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Auth error boundary - handles errors in auth flows
 */
export default function AuthError({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    console.error("[Auth Error Boundary]", error);
  }, [error]);

  const isAuthError = error?.message?.toLowerCase().includes("auth") || error?.message?.toLowerCase().includes("unauthorized");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                {isAuthError ? "Authentication Error" : "Login Error"}
              </h2>
              <p className="text-sm text-yellow-700 mb-4">
                {isAuthError
                  ? "Your session may have expired. Please try logging in again."
                  : "We encountered an error during login. Please try again."}
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mb-4">
                  <summary className="text-xs text-yellow-600 cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-32 text-yellow-800">
                    {error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Try again
                </button>
                <a
                  href="/login"
                  className="inline-flex items-center px-3 py-2 bg-slate-200 text-slate-900 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors"
                >
                  Back to login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
