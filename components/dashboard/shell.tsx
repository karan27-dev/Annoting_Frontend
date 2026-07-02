"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { logout, type Role, type User } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Admin",
  ops_manager: "Operations",
  reviewer: "Reviewer",
  annotator: "Annotator",
  client: "Client",
};

export function DashboardShell({
  user,
  nav,
  children,
}: {
  user: User;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* sidebar — deep ink panel, the premium anchor for every dashboard */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-ink text-canvas transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* subtle warm glow at the top of the panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/15 to-transparent"
        />

        <div className="relative flex items-center justify-between px-5 py-4">
          <Logo
            href="#"
            className="text-canvas [&>span:first-child]:bg-canvas [&>span:first-child]:text-ink"
          />
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg p-1.5 text-canvas/60 transition-colors hover:bg-canvas/10 hover:text-canvas lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative px-3">
          <span className="ml-3 text-xs font-medium uppercase tracking-[0.16em] text-canvas/40">
            {ROLE_LABEL[user.role]}
          </span>
        </div>

        <nav className="relative mt-2 flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                  active
                    ? "bg-canvas text-ink shadow-soft"
                    : "text-canvas/60 hover:bg-canvas/10 hover:text-canvas",
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    "transition-colors",
                    active ? "text-accent" : "text-canvas/40 group-hover:text-canvas/80",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-canvas/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-canvas">
                {user.full_name}
              </p>
              <p className="truncate text-xs text-canvas/50">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="cursor-pointer rounded-lg p-2 text-canvas/50 transition-colors hover:bg-canvas/10 hover:text-canvas"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* main */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/80 px-5 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-ink/5"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Logo href="#" />
        </header>
        <main className="flex-1 px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tighter2">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
