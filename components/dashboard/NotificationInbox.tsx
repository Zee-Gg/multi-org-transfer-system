"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Notification {
  id: number;
  row_count: number;
  message: string | null;
  transferred_at: string;
  from_org_name: string;
  from_org_slug: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
}

export default function NotificationInbox({ isOpen, onClose, orgSlug }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/org/notifications");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to fetch notifications");
          return;
        }
        setNotifications(data.data.notifications || []);
      } catch (e) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Received transfers</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" className="text-indigo-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-slate-300"
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
              <p className="text-xs text-slate-400">You haven't received any transfers yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => {
                const date = new Date(notif.transferred_at);
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {notif.from_org_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formattedDate} at {formattedTime}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-indigo-600">
                          {notif.row_count}
                        </p>
                        <p className="text-xs text-slate-500">
                          {notif.row_count === 1 ? "record" : "records"}
                        </p>
                      </div>
                    </div>

                    {/* Message Preview */}
                    {notif.message && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5 mt-2 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-3 bg-slate-50">
            <a
              href={`/dashboard/${orgSlug}/inbox`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              View all notifications
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </>
  );
}
