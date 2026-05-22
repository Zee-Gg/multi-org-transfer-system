"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Profile {
  id: number;
  name: string;
  email: string;
  slug: string;
  created_at: string;
  totalRows: number;
  totalTransfers: number;
  transfersSent: number;
  transfersReceived: number;
}

export default function OrgProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/org/profile");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to fetch profile");
          return;
        }
        setProfile(data.data.profile);
      } catch (e) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">No profile data available</p>
      </div>
    );
  }

  const createdDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = [
    { label: "Total Records", value: profile.totalRows, color: "bg-blue-50 text-blue-700" },
    { label: "Transfers", value: profile.totalTransfers, color: "bg-indigo-50 text-indigo-700" },
    { label: "Transfers Sent", value: profile.transfersSent, color: "bg-emerald-50 text-emerald-700" },
    { label: "Transfers Received", value: profile.transfersReceived, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Organization Profile</p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-slate-900 font-medium">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-slate-900 font-medium break-all">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Slug</p>
            <p className="text-slate-900 font-medium font-mono">{profile.slug}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organization ID</p>
            <p className="text-slate-900 font-medium font-mono">{profile.id}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Created</p>
            <p className="text-slate-900 font-medium">{createdDate}</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border border-slate-200 ${stat.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                {stat.label}
              </p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
