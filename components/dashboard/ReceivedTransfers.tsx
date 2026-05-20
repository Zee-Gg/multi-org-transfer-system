"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Transfer {
  id: number;
  row_count: number;
  message: string | null;
  transferred_at: string;
  from_org_name: string;
  from_org_slug: string;
}

export default function ReceivedTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransfers() {
      try {
        const res = await fetch("/api/org/notifications");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to fetch notifications");
          return;
        }
        setTransfers(data.data.notifications || []);
      } catch (e) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTransfers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" className="text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-2 text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
          <svg
            className="w-7 h-7 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">No notifications</p>
        <p className="text-xs text-slate-400">You haven't received any data transfers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => {
        const date = new Date(transfer.transferred_at);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={transfer.id}
            className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    <span className="text-emerald-600">Received from</span> {transfer.from_org_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-600">
                  {transfer.row_count.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  {transfer.row_count === 1 ? "record" : "records"}
                </p>
              </div>
            </div>

            {/* Message */}
            {transfer.message && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                  Message from sender
                </p>
                <p className="text-sm text-emerald-900 leading-relaxed break-words">
                  {transfer.message}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Received
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
