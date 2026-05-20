"use client";

import React, { ReactNode } from "react";

interface ClientErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

interface ClientErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client-side error boundary component
 * Wraps components to catch and display errors gracefully
 */
export class ClientErrorBoundary extends React.Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  constructor(props: ClientErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ClientErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ClientErrorBoundary${this.props.context ? ` - ${this.props.context}` : ""}]`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-red-700 mb-3">
            An error occurred while displaying this section. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mb-2">
              <summary className="text-xs text-red-600 cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32 text-red-800 whitespace-pre-wrap break-words">
                {this.state.error?.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to handle errors in async functions
 */
export function useAsyncError() {
  const [, setError] = React.useState();

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}

/**
 * Hook to safely handle async operations
 */
export function useSafeAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: E) => void
) {
  const [state, setState] = React.useState<{
    status: "idle" | "pending" | "success" | "error";
    data: T | null;
    error: E | null;
  }>({
    status: "idle",
    data: null,
    error: null,
  });

  const execute = React.useCallback(async () => {
    setState({ status: "pending", data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ status: "success", data: response, error: null });
      onSuccess?.(response);
      return response;
    } catch (error) {
      const err = error as E;
      setState({ status: "error", data: null, error: err });
      onError?.(err);
      throw err;
    }
  }, [asyncFunction, onSuccess, onError]);

  return { execute, ...state };
}
