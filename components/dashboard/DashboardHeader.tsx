"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import NotificationBell from "@/components/dashboard/NotificationBell";
import NotificationInbox from "@/components/dashboard/NotificationInbox";
import type { SessionPayload } from "@/types";

interface Props { session: SessionPayload }

export default function DashboardHeader({ session }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/org/notifications");
        const data = await res.json();
        if (res.ok) {
          setUnreadCount(data.data.unreadCount || 0);
        }
      } catch (e) {
        // Silently fail
      }
    }

    fetchUnreadCount();
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:block">DataBridge</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Badge variant="info" dot>{session.orgName}</Badge>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600">
                  {session.orgName.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-slate-600 font-medium truncate max-w-[140px]">
                {session.email}
              </span>
            </div>

            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setShowNotifications(true)}
            />

            <a
              href={`/dashboard/${session.orgSlug}/profile`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              title="View profile"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18.75" />
              </svg>
              <span className="hidden sm:block">Profile</span>
            </a>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
            title="Log out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <NotificationInbox
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
    />
    </>
  );
}