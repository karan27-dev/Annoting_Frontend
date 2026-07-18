"use client";

import { ListChecks, BarChart3, Wallet } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/lib/use-auth";

const nav: NavItem[] = [
  { href: "/reviewer/quotes", label: "Quotes", icon: Wallet },
  { href: "/reviewer/queue", label: "Review queue", icon: ListChecks },
  { href: "/reviewer/scorecards", label: "Scorecards", icon: BarChart3 },
];

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(["reviewer", "super_admin"]);
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
