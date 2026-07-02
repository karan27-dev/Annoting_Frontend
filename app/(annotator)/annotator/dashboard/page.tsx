"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Tags,
  Target,
  Wallet,
  Trophy,
  ExternalLink,
  Inbox,
  Play,
  Send,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Stat, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  EmptyState,
  QualityBadge,
  StatusBadge,
} from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { cn, formatINR, formatNumber } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

interface Performance {
  rolling_accuracy: number;
  labels_this_week: number;
  earnings_week_inr: number;
  rank: number | null;
  total_active: number;
}
interface AvailableJob {
  cvat_job_id: number;
  project_name: string;
  annotation_type: string;
  image_count: number;
  rate_per_label: number;
  estimated_minutes: number;
}
interface ActiveJob {
  cvat_job_id: number;
  project_name: string;
  annotation_type: string;
  image_count: number;
  status: string;
  deep_link: string;
}
interface HistoryJob {
  cvat_job_id: number;
  project_name: string;
  annotation_type: string;
  image_count: number;
  status: string;
  iou_score: number | null;
  rework_count: number;
}

const TABS = ["Available", "Active", "Completed"] as const;
type Tab = (typeof TABS)[number];

export default function AnnotatorDashboard() {
  const [tab, setTab] = useState<Tab>("Available");
  const [perf, setPerf] = useState<Performance | null>(null);
  const [available, setAvailable] = useState<AvailableJob[] | null>(null);
  const [active, setActive] = useState<ActiveJob[] | null>(null);
  const [history, setHistory] = useState<HistoryJob[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [creds, setCreds] = useState<{
    username: string | null;
    password: string | null;
    deep_link: string;
  } | null>(null);

  const refresh = useCallback(() => {
    api<Performance>("/annotator/performance").then(setPerf).catch(() => setPerf(null));
    api<AvailableJob[]>("/annotator/jobs/available")
      .then(setAvailable)
      .catch(() => setAvailable([]));
    api<ActiveJob[]>("/annotator/jobs/active").then(setActive).catch(() => setActive([]));
    api<HistoryJob[]>("/annotator/jobs/history")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => refresh(), [refresh]);

  async function accept(job: AvailableJob) {
    setBusy(job.cvat_job_id);
    try {
      const res = await api<{
        deep_link: string;
        cvat_username: string | null;
        cvat_password: string | null;
      }>(`/annotator/jobs/${job.cvat_job_id}/accept`, { method: "POST" });
      refresh();
      setTab("Active");
      // Show the canvas login so the annotator can sign into CVAT and label.
      setCreds({
        username: res.cvat_username,
        password: res.cvat_password,
        deep_link: res.deep_link,
      });
    } finally {
      setBusy(null);
    }
  }

  async function submit(job: ActiveJob) {
    setBusy(job.cvat_job_id);
    try {
      await api(`/annotator/jobs/${job.cvat_job_id}/submit`, { method: "POST" });
      refresh();
    } finally {
      setBusy(null);
    }
  }

  const counts = {
    Available: available?.length ?? 0,
    Active: active?.length ?? 0,
    Completed: history?.length ?? 0,
  };

  return (
    <>
      <PageHeader
        title="Your work"
        description="Pick up jobs you're certified for, label them in the canvas, and submit for review."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Labels this week"
          value={formatNumber(perf?.labels_this_week ?? 0)}
          icon={<Tags size={18} />}
        />
        <Stat
          label="Accuracy"
          value={perf ? `${(perf.rolling_accuracy * 100).toFixed(0)}%` : "—"}
          hint="Rolling 30-day IoU"
          icon={<Target size={18} />}
        />
        <Stat
          label="Earnings this week"
          value={formatINR(perf?.earnings_week_inr ?? 0)}
          icon={<Wallet size={18} />}
        />
        <Stat
          label="Rank"
          value={perf?.rank ? `#${perf.rank}` : "—"}
          hint={perf?.total_active ? `of ${perf.total_active} active` : undefined}
          icon={<Trophy size={18} />}
        />
      </div>

      {/* tabs */}
      <div className="mt-8 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative cursor-pointer px-4 py-2.5 text-sm transition-colors",
              tab === t ? "text-ink" : "text-faint hover:text-muted",
            )}
          >
            {t}
            <span className="ml-1.5 rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-xs text-muted">
              {counts[t]}
            </span>
            {tab === t && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* AVAILABLE */}
        {tab === "Available" &&
          (available === null ? (
            <Skeleton />
          ) : available.length === 0 ? (
            <EmptyState
              icon={<Inbox size={28} />}
              title="No jobs available right now"
              description="New jobs matching your certified skills appear here as soon as admins launch projects. Finish your calibration to unlock more task types."
            />
          ) : (
            <DataTable
              columns={["Project", "Type", "Files", "Rate", "Est. time", ""]}
            >
              {available.map((j) => (
                <tr key={j.cvat_job_id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3">
                    <span className="font-medium">{j.project_name}</span>
                    <span className="mt-0.5 block text-xs text-faint">
                      Full dataset — one job, nothing split
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{TYPE_LABEL[j.annotation_type]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatNumber(j.image_count)}
                  </td>
                  <td className="px-4 py-3">{formatINR(j.rate_per_label)}/label</td>
                  <td className="px-4 py-3 text-muted">~{j.estimated_minutes} min</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => accept(j)}
                      disabled={busy === j.cvat_job_id}
                    >
                      {busy === j.cvat_job_id ? "Accepting…" : "Accept"}
                      {busy !== j.cvat_job_id && <Play size={14} />}
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          ))}

        {/* ACTIVE */}
        {tab === "Active" &&
          (active === null ? (
            <Skeleton />
          ) : active.length === 0 ? (
            <EmptyState
              icon={<Play size={28} />}
              title="No active jobs"
              description="Accept a job from the Available tab to start labeling."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((j) => (
                <Card key={j.cvat_job_id} className="hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold tracking-tightish">
                        {j.project_name}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {TYPE_LABEL[j.annotation_type]} ·{" "}
                        {formatNumber(j.image_count)} images · Job #
                        {j.cvat_job_id}
                      </p>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <a
                      href={j.deep_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        <ExternalLink size={14} /> Continue in canvas
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => submit(j)}
                      disabled={busy === j.cvat_job_id}
                    >
                      {busy === j.cvat_job_id ? "Submitting…" : "Submit"}
                      {busy !== j.cvat_job_id && <Send size={14} />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ))}

        {/* COMPLETED */}
        {tab === "Completed" &&
          (history === null ? (
            <Skeleton />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={28} />}
              title="Nothing submitted yet"
              description="Jobs you submit for review show up here with their QA score and outcome."
            />
          ) : (
            <DataTable
              columns={["Project", "Type", "Images", "Score", "Rework", "Status"]}
            >
              {history.map((j) => (
                <tr key={j.cvat_job_id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3 font-medium">{j.project_name}</td>
                  <td className="px-4 py-3 text-muted">
                    {TYPE_LABEL[j.annotation_type]}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatNumber(j.image_count)}
                  </td>
                  <td className="px-4 py-3">
                    {j.iou_score != null ? (
                      <QualityBadge iou={j.iou_score} />
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{j.rework_count}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={j.status} />
                  </td>
                </tr>
              ))}
            </DataTable>
          ))}
      </div>

      {creds && (
        <CanvasCredsModal creds={creds} onClose={() => setCreds(null)} />
      )}
    </>
  );
}

function CanvasCredsModal({
  creds,
  onClose,
}: {
  creds: { username: string | null; password: string | null; deep_link: string };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-elevated p-7 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold tracking-tightish">
          Job accepted — open the canvas
        </h3>
        <p className="mt-1.5 text-sm text-muted">
          Label this job in the CVAT canvas. Sign in with your dedicated canvas
          account below (save these — you&apos;ll reuse them for every job).
        </p>

        {creds.username ? (
          <div className="mt-5 space-y-2 rounded-xl border border-line bg-canvas p-4">
            <CredRow label="Canvas username" value={creds.username} />
            <CredRow label="Canvas password" value={creds.password ?? ""} />
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-accent-soft p-4 text-sm text-accent-ink">
            Use the canvas login we emailed you when your account was created.
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <a
            href={creds.deep_link}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
            onClick={onClose}
          >
            <Button className="w-full">
              Open canvas <ExternalLink size={15} />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <code className="rounded-md bg-ink/[0.06] px-2 py-1 font-mono text-sm">
        {value}
      </code>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-32 rounded-lg border border-line bg-surface p-5">
      <div className="skeleton h-5 w-1/3 rounded" />
      <div className="skeleton mt-4 h-4 w-2/3 rounded" />
    </div>
  );
}
