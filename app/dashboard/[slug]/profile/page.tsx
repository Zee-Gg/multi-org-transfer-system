import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrgProfile from "@/components/dashboard/OrgProfile";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organization Profile" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  if (slug !== session.orgSlug) redirect(`/dashboard/${session.orgSlug}`);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <a
            href={`/dashboard/${session.orgSlug}`}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <OrgProfile />
      </main>
    </div>
  );
}
