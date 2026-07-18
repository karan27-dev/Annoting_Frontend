"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  Tags,
  IndianRupee,
  Wallet,
  ClipboardCheck,
  ArrowUpRight,
  Boxes,
  ScanSearch,
  ShieldCheck,
  PencilRuler,
  PackageCheck,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Stat, Card } from "@/components/ui/card";
import { MiniBars } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { cn, formatINR, formatNumber } from "@/lib/utils";

interface Funnel {
  awaiting_data: number;
  counting: number;
  pending_quote: number;
  quoted: number;
  in_annotation: number;
  in_review: number;
  delivered: number;
}

interface AdminSummary {
  active_projects: number;
  annotators_online: number;
  labels_today: number;
  revenue_mtd_inr: number;
  outstanding_inr: number;
  pending_setup: number;
  pending_quotes: number;
  review_queue: number;
  funnel: Funnel;
  labels_series_14d: number[];
}

const STAGES: {
  key: keyof Funnel;
  label: string;
  icon: typeof Boxes;
  href?: string;
}[] = [
  { key: "awaiting_data", label: "Awaiting data", icon: Boxes },
  { key: "counting", label: "Counting", icon: ScanSearch },
  { key: "pending_quote", label: "Needs quote", icon: Wallet, href: "/admin/quotes" },
  { key: "quoted", label: "Quoted", icon: IndianRupee },
  { key: "in_annotation", label: "Annotating", icon: PencilRuler, href: "/admin/projects" },
  { key: "in_review", label: "In review", icon: ShieldCheck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

export default function AdminDashboard() {
  const [s, setS] = useState<AdminSummary | null>(null);

  useEffect(() => {
    api<AdminSummary>("/admin/dashboard").then(setS).catch(() => setS(null));
  }, []);

  const maxStage = s
    ? Math.max(...STAGES.map((st) => s.funnel[st.key]), 1)
    : 1;

  return (
    <>
      <PageHeader
        title="Operations overview"
        description="The full pipeline at a glance — data, quotes, annotation, review and revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active projects"
          value={s?.active_projects ?? "—"}
          hint={s?.pending_setup ? `${s.pending_setup} awaiting data` : undefined}
          icon={<FolderKanban size={18} />}
        />
        <Stat
          label="Annotators online"
          value={s?.annotators_online ?? "—"}
          icon={<Users size={18} />}
        />
        <Stat
          label="Labels today"
          value={formatNumber(s?.labels_today ?? 0)}
          icon={<Tags size={18} />}
        />
        <Stat
          label="Revenue MTD"
          value={formatINR(s?.revenue_mtd_inr ?? 0)}
          hint={
            s?.outstanding_inr
              ? `${formatINR(s.outstanding_inr)} outstanding`
              : undefined
          }
          icon={<IndianRupee size={18} />}
        />
      </div>

      {/* Action queues — the things an operator should act on now */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/admin/quotes"
          icon={<Wallet size={18} />}
          label="Quotes to review & publish"
          count={s?.pending_quotes ?? 0}
          tone="accent"
        />
        <ActionCard
          href="/admin/projects"
          icon={<ClipboardCheck size={18} />}
          label="Jobs waiting for review"
          count={s?.review_queue ?? 0}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Pipeline funnel */}
        <Card className="p-6">
          <p className="text-sm font-medium">Pipeline</p>
          <p className="mt-0.5 text-xs text-faint">
            Every project by stage — intake to delivery
          </p>
          <div className="mt-4 space-y-2.5">
            {STAGES.map((st) => {
              const n = s?.funnel[st.key] ?? 0;
              const pct = (n / maxStage) * 100;
              const row = (
                <div className="flex items-center gap-3">
                  <st.icon size={15} className="shrink-0 text-faint" />
                  <span className="w-28 shrink-0 text-sm text-muted">
                    {st.label}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-canvas">
                    <div
                      className={cn(
                        "flex h-full items-center justify-end rounded-md px-2 text-xs font-medium transition-all duration-500",
                        n > 0 ? "bg-accent text-white" : "bg-transparent",
                      )}
                      style={{ width: `${Math.max(pct, n > 0 ? 8 : 0)}%` }}
                    >
                      {n > 0 ? n : ""}
                    </div>
                  </div>
                  {n === 0 && (
                    <span className="w-4 text-right text-xs text-faint">0</span>
                  )}
                </div>
              );
              return st.href ? (
                <Link
                  key={st.key}
                  href={st.href}
                  className="block rounded-lg px-1 py-0.5 transition-colors hover:bg-ink/[0.03]"
                >
                  {row}
                </Link>
              ) : (
                <div key={st.key} className="px-1 py-0.5">
                  {row}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Throughput */}
        <Card className="p-6">
          <p className="text-sm font-medium">Labels delivered — last 14 days</p>
          {s && s.labels_series_14d.some((n) => n > 0) ? (
            <>
              <MiniBars className="mt-4 h-28" data={s.labels_series_14d} />
              <div className="mt-3 flex items-center justify-between text-xs text-faint">
                <span>14 days ago</span>
                <span>
                  {formatNumber(
                    s.labels_series_14d.reduce((a, b) => a + b, 0),
                  )}{" "}
                  total
                </span>
                <span>Today</span>
              </div>
            </>
          ) : (
            <div className="mt-4 flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-line text-center">
              <Clock size={22} className="text-faint" />
              <p className="mt-2 text-sm text-muted">No labels delivered yet</p>
              <p className="text-xs text-faint">
                Fills in live as reviewers approve work
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function ActionCard({
  href,
  icon,
  label,
  count,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  tone: "accent" | "warning";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-lg border p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft",
        count > 0
          ? tone === "accent"
            ? "border-accent/40 bg-accent-soft/40"
            : "border-warning/40 bg-warning/5"
          : "border-line bg-surface",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            count > 0
              ? tone === "accent"
                ? "bg-accent text-white"
                : "bg-warning text-white"
              : "bg-ink/[0.06] text-faint",
          )}
        >
          {icon}
        </span>
        <div>
          <p className="text-2xl font-semibold tracking-tighter2">{count}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
      <ArrowUpRight
        size={18}
        className="text-faint transition-colors group-hover:text-accent"
      />
    </Link>
  );
}
