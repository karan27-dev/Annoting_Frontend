"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Tags } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card, Stat } from "@/components/ui/card";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/utils";

interface Performance {
  labels_this_week: number;
  earnings_week_inr: number;
}
interface Profile {
  total_labels_completed: number;
  total_jobs_completed: number;
}
interface HistoryJob {
  cvat_job_id: number;
  project_name: string;
  image_count: number;
  status: string;
}

export default function EarningsPage() {
  const [perf, setPerf] = useState<Performance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryJob[] | null>(null);

  useEffect(() => {
    api<Performance>("/annotator/performance").then(setPerf).catch(() => {});
    api<Profile>("/annotator/profile").then(setProfile).catch(() => {});
    api<HistoryJob[]>("/annotator/jobs/history")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Earnings"
        description="Your weekly tally and completed-work history. Payouts are issued monthly."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="This week"
          value={formatINR(perf?.earnings_week_inr ?? 0)}
          hint={`${formatNumber(perf?.labels_this_week ?? 0)} labels`}
          icon={<Wallet size={18} />}
        />
        <Stat
          label="Jobs completed"
          value={formatNumber(profile?.total_jobs_completed ?? 0)}
          icon={<TrendingUp size={18} />}
        />
        <Stat
          label="Lifetime labels"
          value={formatNumber(profile?.total_labels_completed ?? 0)}
          icon={<Tags size={18} />}
        />
      </div>

      <Card className="mt-6 flex items-center gap-4 border-accent/30 bg-accent-soft/40">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
          <Wallet size={18} />
        </span>
        <div>
          <p className="font-medium text-accent-ink">Payouts are monthly</p>
          <p className="text-sm text-accent-ink/70">
            Approved work is tallied and paid out via bank transfer at the end of
            each month. Automated payouts are coming soon.
          </p>
        </div>
      </Card>

      <h2 className="mb-4 mt-8 text-lg font-semibold tracking-tightish">
        Submitted &amp; completed work
      </h2>
      {history === null ? (
        <div className="h-24 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<Wallet size={28} />}
          title="No completed work yet"
          description="Accept and submit jobs to start earning — they'll appear here."
        />
      ) : (
        <DataTable columns={["Project", "Job", "Images", "Status"]}>
          {history.map((j) => (
            <tr key={j.cvat_job_id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-medium">{j.project_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-faint">
                #{j.cvat_job_id}
              </td>
              <td className="px-4 py-3 text-muted">
                {formatNumber(j.image_count)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={j.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
