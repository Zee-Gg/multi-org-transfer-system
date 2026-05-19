import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "../DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organization Beta" };

export default async function OrgBDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.orgSlug !== "org-b") redirect(`/dashboard/${session.orgSlug}`);
  return <DashboardShell session={session} />;
}