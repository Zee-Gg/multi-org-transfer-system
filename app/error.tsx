"use client";

import React from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error boundary - catches all unhandled errors
 */
export default function RootError({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    // Log error to error reporting service (e.g., Sentry)
    console.error("[Root Error Boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h1>
                  <p className="text-sm text-red-700 mb-4">
                    We encountered an unexpected error. Please try again or contact support if the problem persists.
                  </p>
                  {process.env.NODE_ENV === "development" && (
                    <details className="mb-4">
                      <summary className="text-xs text-red-600 cursor-pointer font-medium hover:text-red-700">
                        Error details
                      </summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 text-red-800">
                        {error.message}
                        {"\n\n"}
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Try again
                    </button>
                    <a
                      href="/"
                      className="inline-flex items-center px-3 py-2 bg-slate-200 text-slate-900 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors"
                    >
                      Go home
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
