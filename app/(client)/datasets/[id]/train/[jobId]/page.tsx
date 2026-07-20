"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Cpu,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TrainingJob } from "@/lib/types";

export default function TrainingMonitor() {
  const { id, jobId } = useParams<{ id: string; jobId: string }>();
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(() => {
    api<TrainingJob>(`/training/jobs/${jobId}`).then(setJob).catch(() => {});
  }, [jobId]);

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [poll]);

  useEffect(() => {
    if (job && (job.status === "completed" || job.status === "failed") && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [job]);

  async function cancelJob() {
    if (!job || cancelling) return;
    setCancelling(true);
    try {
      await api(`/training/jobs/${jobId}/cancel`, { method: "POST" });
      poll();
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const isLocalBackend = /localhost|127\.0\.0\.1/.test(job.script_url ?? "");
  const colabCell = `# 1) Runtime → Change runtime type → GPU\n# 2) Paste & run this cell\nimport urllib.request\nexec(urllib.request.urlopen("${job.script_url}").read().decode())`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/datasets/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to project
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tighter2">
            <Cpu size={22} /> {job.architecture.toUpperCase()} · {job.model_size.toUpperCase()}
          </h1>
          <p className="mt-0.5 text-muted">{job.epochs_total} epochs</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={job.status} epoch={job.current_epoch} total={job.epochs_total} />
          {(job.status === "running" || job.status === "awaiting_gpu") && (
            <button
              onClick={cancelJob}
              disabled={cancelling}
              className="cursor-pointer rounded-full border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      </div>

      {/* Backend-not-public warning — Colab can't reach localhost */}
      {job.status === "awaiting_gpu" && isLocalBackend && (
        <Card className="mt-6 border-warning/40 bg-warning/5 p-6">
          <p className="flex items-center gap-2 font-medium text-warning">
            <CircleAlert size={17} /> Your backend isn&apos;t reachable from Colab yet
          </p>
          <p className="mt-1.5 text-sm text-muted">
            The training cell points at <code className="rounded bg-ink/[0.06] px-1">localhost</code>,
            which Colab (running on Google&apos;s servers) can&apos;t reach — that&apos;s the
            connection-refused error. To use a free Colab GPU, your backend needs a public
            URL:
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>
              Install a tunnel: <code className="rounded bg-ink/[0.06] px-1">brew install cloudflared</code>
            </li>
            <li>
              Run: <code className="rounded bg-ink/[0.06] px-1">cloudflared tunnel --url http://localhost:8000</code>
            </li>
            <li>
              Put the <code className="rounded bg-ink/[0.06] px-1">https://…trycloudflare.com</code> URL in
              <code className="mx-1 rounded bg-ink/[0.06] px-1">backend/.env</code> as
              <code className="mx-1 rounded bg-ink/[0.06] px-1">BACKEND_PUBLIC_URL</code>, restart the
              backend, and re-open this page.
            </li>
          </ol>
          <p className="mt-3 text-xs text-faint">
            Or deploy the backend so it has a real public URL. The copy-cell below will work
            the moment the URL is public.
          </p>
        </Card>
      )}

      {/* Connect GPU — shown until the trainer reports in */}
      {job.status === "awaiting_gpu" && (
        <Card className="mt-6 p-6">
          <p className="font-semibold tracking-tightish">Connect a free GPU (Google Colab)</p>
          <p className="mt-1 text-sm text-muted">
            Open a new{" "}
            <a
              href="https://colab.research.google.com/#create=true"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-ink underline-offset-2 hover:underline"
            >
              Colab notebook
            </a>
            , set the runtime to GPU, then paste and run this cell. It trains on
            Colab&apos;s free GPU and streams results back here live.
          </p>
          <div className="relative mt-4">
            <pre className="overflow-x-auto rounded-xl bg-ink p-4 pr-12 text-xs leading-relaxed text-canvas">
              {colabCell}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(colabCell);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="absolute right-3 top-3 flex cursor-pointer items-center gap-1 rounded-lg bg-canvas/10 px-2 py-1 text-xs text-canvas hover:bg-canvas/20"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-faint">
            <Loader2 size={13} className="animate-spin" /> Waiting for the trainer
            to connect…
          </p>
        </Card>
      )}

      {job.status === "failed" && (
        <Card className="mt-6 border-danger/30 bg-danger/5 p-6">
          <p className="flex items-center gap-2 font-medium text-danger">
            <CircleAlert size={17} /> Training failed
          </p>
          <p className="mt-1 text-sm text-muted">{job.error}</p>
        </Card>
      )}

      {/* Live epoch curves */}
      {job.metrics.length > 0 && (
        <Card className="mt-6 p-6">
          <p className="text-sm font-medium">Training progress</p>
          <EpochChart job={job} />
        </Card>
      )}

      {/* Results */}
      {job.status === "completed" && job.results && (
        <Results results={job.results} />
      )}
    </div>
  );
}

function StatusPill({
  status,
  epoch,
  total,
}: {
  status: string;
  epoch: number;
  total: number;
}) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
        <CircleCheck size={15} /> Completed
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger">
        <CircleAlert size={15} /> Failed
      </span>
    );
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent-ink">
        <Loader2 size={15} className="animate-spin" /> Epoch {epoch}/{total}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-3 py-1.5 text-sm font-medium text-muted">
      <Loader2 size={15} className="animate-spin" /> Awaiting GPU
    </span>
  );
}

function EpochChart({ job }: { job: TrainingJob }) {
  const W = 620;
  const H = 180;
  const pad = 32;

  const xs = job.metrics.map((m) => m.epoch);
  const maxX = Math.max(job.epochs_total, ...xs, 1);
  const px = (e: number) => pad + ((e - 1) / Math.max(1, maxX - 1)) * (W - pad * 2);

  const accSeries: { key: keyof typeof job.metrics[number]; color: string; label: string }[] = [
    { key: "map50",     color: "#e2553d", label: "mAP@50"    },
    { key: "precision", color: "#3b6ea5", label: "Precision"  },
    { key: "recall",    color: "#2f8f5b", label: "Recall"     },
  ];

  // Loss chart — only render if we have non-zero loss data
  const lossVals = job.metrics.map((m) => m.train_loss ?? 0).filter(Boolean);
  const maxLoss  = Math.max(...lossVals, 0.001);

  function Axes() {
    return (
      <>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={pad} x2={W - pad}
              y1={pad + (1 - g) * (H - pad * 2)}
              y2={pad + (1 - g) * (H - pad * 2)}
              stroke="var(--line)" strokeWidth={1} />
            <text x={4} y={pad + (1 - g) * (H - pad * 2) + 3} fontSize={9} fill="var(--faint)">
              {g}
            </text>
          </g>
        ))}
      </>
    );
  }

  return (
    <div className="mt-3 space-y-5">
      {/* Accuracy chart */}
      <div>
        <p className="mb-1 text-xs font-medium text-muted">Accuracy</p>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]">
            <Axes />
            {accSeries.map((s) => {
              const pts = job.metrics
                .filter((m) => m[s.key] != null)
                .map((m) => {
                  const y = pad + (1 - (m[s.key] as number)) * (H - pad * 2);
                  return `${px(m.epoch)},${y}`;
                });
              return pts.length === 0 ? null : (
                <polyline key={s.key} points={pts.join(" ")}
                  fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              );
            })}
          </svg>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
          {accSeries.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-4 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Loss chart — only shown when loss data is available */}
      {lossVals.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted">Training Loss</p>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]">
              {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                const label = (maxLoss * (1 - g)).toFixed(2);
                return (
                  <g key={g}>
                    <line x1={pad} x2={W - pad}
                      y1={pad + g * (H - pad * 2)}
                      y2={pad + g * (H - pad * 2)}
                      stroke="var(--line)" strokeWidth={1} />
                    <text x={4} y={pad + g * (H - pad * 2) + 3} fontSize={9} fill="var(--faint)">
                      {label}
                    </text>
                  </g>
                );
              })}
              <polyline
                points={job.metrics
                  .map((m) => {
                    const loss = m.train_loss ?? 0;
                    const y = pad + (1 - loss / maxLoss) * (H - pad * 2);
                    return `${px(m.epoch)},${y}`;
                  })
                  .join(" ")}
                fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="mt-1.5 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-4 rounded-full bg-amber-400" />
              Train Loss
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ results }: { results: NonNullable<TrainingJob["results"]> }) {
  const tiles = [
    { label: "mAP@50", value: results.map50 },
    { label: "mAP@50-95", value: results.map50_95 },
    { label: "Precision", value: results.precision },
    { label: "Recall", value: results.recall },
    { label: "F1", value: results.f1 },
  ];
  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 text-center">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tighter2">
              {(t.value * 100).toFixed(1)}%
            </p>
          </Card>
        ))}
      </div>

      {results.per_class.length > 0 && (
        <Card className="p-6">
          <p className="mb-3 text-sm font-medium">Per-class accuracy</p>
          <div className="space-y-3">
            {results.per_class.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-muted">{c.name}</span>
                  <span className="font-medium">{(c.map50 * 100).toFixed(1)}% mAP</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${c.map50 * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ConfusionMatrix cm={results.confusion_matrix} />
        <ConfidenceCurve
          curve={results.confidence_curve}
          optimal={results.optimal_confidence}
        />
      </div>
    </div>
  );
}

function ConfusionMatrix({
  cm,
}: {
  cm: { labels: string[]; matrix: number[][] };
}) {
  const max = Math.max(1, ...cm.matrix.flat());
  return (
    <Card className="p-6">
      <p className="mb-1 text-sm font-medium">Confusion matrix</p>
      <p className="mb-3 text-xs text-faint">Rows = actual · Columns = predicted</p>
      {cm.matrix.length === 0 ? (
        <p className="text-sm text-faint">Not reported.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-xs">
            <tbody>
              {cm.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="pr-2 text-right font-medium capitalize text-muted">
                    {cm.labels[i] ?? i}
                  </td>
                  {row.map((val, j) => (
                    <td key={j} className="p-0.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded"
                        style={{
                          backgroundColor: `rgba(226,85,61,${val / max})`,
                          color: val / max > 0.5 ? "#fff" : "var(--ink)",
                        }}
                      >
                        {val}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {cm.labels.map((l, j) => (
                  <td key={j} className="pt-1 text-center capitalize text-faint">
                    {l.slice(0, 4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ConfidenceCurve({
  curve,
  optimal,
}: {
  curve: { confidence: number; f1: number }[];
  optimal: number;
}) {
  const W = 320;
  const H = 180;
  const pad = 26;
  const px = (c: number) => pad + c * (W - pad * 2);
  const py = (f: number) => pad + (1 - f) * (H - pad * 2);
  return (
    <Card className="p-6">
      <p className="mb-1 text-sm font-medium">F1 vs confidence</p>
      <p className="mb-3 text-xs text-faint">
        Optimal confidence ≈{" "}
        <span className="font-medium text-accent-ink">{optimal.toFixed(2)}</span>
      </p>
      {curve.length === 0 ? (
        <p className="text-sm text-faint">Not reported.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--line)" />
          <polyline
            points={curve.map((p) => `${px(p.confidence)},${py(p.f1)}`).join(" ")}
            fill="none"
            stroke="#e2553d"
            strokeWidth={2}
          />
          <line
            x1={px(optimal)}
            y1={pad}
            x2={px(optimal)}
            y2={H - pad}
            stroke="var(--accent-ink)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text x={pad} y={H - 6} fontSize={9} fill="var(--faint)">
            0
          </text>
          <text x={W - pad - 6} y={H - 6} fontSize={9} fill="var(--faint)">
            1.0
          </text>
        </svg>
      )}
    </Card>
  );
}
