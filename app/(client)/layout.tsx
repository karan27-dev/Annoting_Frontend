"use client";

import {
  FolderKanban,
  Workflow,
  Boxes,
  Rocket,
  Compass,
  Receipt,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/lib/use-auth";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/models", label: "Models", icon: Boxes },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/universe", label: "Universe", icon: Compass },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(["client", "super_admin"]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  );
}
