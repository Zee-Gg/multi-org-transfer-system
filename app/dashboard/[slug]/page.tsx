import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "../DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

interface Props {
  params: {
    slug: string;
  };
}

export default async function DynamicOrgDashboard({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  
  const { slug } = params;
  
  // Ensure user can only access their own organization's dashboard
  if (session.orgSlug !== slug) {
    redirect(`/dashboard/${session.orgSlug}`);
  }
  
  return <DashboardShell session={session} />;
}
