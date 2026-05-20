"use client";
import { useState, useEffect } from "react";

interface Props {
  unreadCount?: number;
  onClick: () => void;
}

export default function NotificationBell({ unreadCount = 0, onClick }: Props) {
  const [count, setCount] = useState(unreadCount);

  useEffect(() => {
    setCount(unreadCount);
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
      title="Notifications"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        </div>
      )}
    </button>
  );
}
