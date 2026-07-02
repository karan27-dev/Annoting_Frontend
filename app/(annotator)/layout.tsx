"use client";

import { LayoutDashboard, GraduationCap, Wallet } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/lib/use-auth";

const nav: NavItem[] = [
  { href: "/annotator/dashboard", label: "Jobs & performance", icon: LayoutDashboard },
  { href: "/annotator/calibration", label: "Calibration", icon: GraduationCap },
  { href: "/annotator/earnings", label: "Earnings", icon: Wallet },
];

export default function AnnotatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(["annotator", "super_admin"]);
  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  );
}
