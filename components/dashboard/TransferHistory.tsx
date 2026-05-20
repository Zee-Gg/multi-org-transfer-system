"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Transfer {
  id: number;
  row_count: number;
  message: string | null;
  transferred_at: string;
  from_org_name: string;
  to_org_name: string;
}

export default function TransferHistory() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransfers() {
      try {
        const res = await fetch("/api/transfer");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to fetch transfer history");
          return;
        }
        setTransfers(data.data.transfers || []);
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
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">No transfers yet</p>
        <p className="text-xs text-slate-400">Transfer data to see history here</p>
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
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {transfer.from_org_name}
                    <span className="text-slate-400 font-normal"> → </span>
                    {transfer.to_org_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-indigo-600">
                  {transfer.row_count.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  {transfer.row_count === 1 ? "record" : "records"}
                </p>
              </div>
            </div>

            {/* Message */}
            {transfer.message && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Message
                </p>
                <p className="text-sm text-slate-700 leading-relaxed break-words">
                  {transfer.message}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
