"use client";

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  Wallet,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/lib/use-auth";

const nav: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/quotes", label: "Quotes", icon: Wallet },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/annotators", label: "Annotators", icon: Users },
  { href: "/admin/billing", label: "Invoices", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(["super_admin", "ops_manager"]);
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
