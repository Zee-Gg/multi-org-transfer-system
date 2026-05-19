import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "../DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organization Alpha" };

export default async function OrgADashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.orgSlug !== "org-a") redirect(`/dashboard/${session.orgSlug}`);
  return <DashboardShell session={session} />;
}