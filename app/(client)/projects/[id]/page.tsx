"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  GaugeCircle,
  TrendingUp,
  Lock,
  UploadCloud,
  Link2,
  Loader2,
  Check,
} from "lucide-react";
import { Card, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import {
  ProgressBar,
  QualityBadge,
  StatusBadge,
  MiniBars,
  EmptyState,
} from "@/components/dashboard/widgets";
import {
  DetectedCounts,
  IntakePipeline,
  QuoteCard,
  useIntake,
} from "@/components/dashboard/intake";
import { api } from "@/lib/api";
import { linkGoogleDrive, uploadDataset } from "@/lib/upload";
import { cn, formatNumber } from "@/lib/utils";
import { DELIVERY_FORMATS, type Project } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

const TABS = ["Progress", "Quality", "Preview", "Download"] as const;
type Tab = (typeof TABS)[number];

interface QualityData {
  aggregate_iou: number | null;
  quality_target: number;
  reviewed_jobs: number;
  total_jobs: number;
  total_shapes: number;
  per_class: { name: string; color: string; count: number; share: number }[];
  velocity: { day: string; labels: number }[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [quality, setQuality] = useState<QualityData | null>(null);
  const [tab, setTab] = useState<Tab>("Progress");

  useEffect(() => {
    api<Project>(`/projects/${id}`)
      .then(setProject)
      .catch(() => setProject(null));
    api<QualityData>(`/projects/${id}/quality`)
      .then(setQuality)
      .catch(() => setQuality(null));
  }, [id]);

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  const pct = project.total_images
    ? Math.round((project.images_completed / project.total_images) * 100)
    : 0;
  const remaining = project.total_images - project.images_completed;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter2">{project.name}</h1>
          <p className="mt-1 text-muted">
            {TYPE_LABEL[project.annotation_type]} ·{" "}
            {formatNumber(project.total_images)} images
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          {project.quality_score ? (
            <QualityBadge iou={project.quality_score} />
          ) : null}
        </div>
      </div>

      {/* Intake: until the quote is accepted this is the main event. */}
      {project.status === "pending_setup" && (
        <IntakeSection project={project} />
      )}

      {/* tabs */}
      <div className="mt-7 flex gap-1 border-b border-line">
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
            {tab === t && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === "Progress" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Completed" value={`${pct}%`} icon={<TrendingUp size={18} />} />
              <Stat
                label="Images labeled"
                value={formatNumber(project.images_completed)}
                hint={`${formatNumber(remaining)} remaining`}
                icon={<ImageIcon size={18} />}
              />
              <Stat
                label="Quality target"
                value={`IoU ${project.quality_target.toFixed(2)}`}
                icon={<GaugeCircle size={18} />}
              />
            </div>

            <Card className="p-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Overall progress</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <ProgressBar value={pct} className="h-3" />
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-faint">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Labeled
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-line" /> Remaining
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-medium">Velocity — labels / day</p>
              {quality && quality.velocity.some((v) => v.labels > 0) ? (
                <>
                  <MiniBars
                    className="mt-4 h-20"
                    data={quality.velocity.map((v) => v.labels)}
                  />
                  <div className="mt-2 flex justify-between text-xs text-faint">
                    {quality.velocity.map((v, i) => (
                      <span key={i}>{v.day}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-faint">
                  No labels submitted yet — this fills in live as annotators work.
                </p>
              )}
            </Card>
          </div>
        )}

        {tab === "Quality" && (
          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-sm text-muted">Aggregate quality</p>
              {quality?.aggregate_iou != null ? (
                <>
                  <p className="display mt-2 text-4xl font-semibold">
                    IoU {quality.aggregate_iou.toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-faint">
                    Target {(quality?.quality_target ?? 0.85).toFixed(2)} ·{" "}
                    {quality.reviewed_jobs} of {quality.total_jobs} jobs approved
                  </p>
                </>
              ) : (
                <>
                  <p className="display mt-2 text-4xl font-semibold text-faint">
                    —
                  </p>
                  <p className="mt-1 text-sm text-faint">
                    Quality scores appear once reviewers start approving jobs
                    (target IoU {(project.quality_target ?? 0.85).toFixed(2)}).
                  </p>
                </>
              )}
            </Card>
            <Card className="p-6">
              <p className="mb-4 text-sm font-medium">
                Label distribution
                {quality && quality.total_shapes > 0 && (
                  <span className="ml-1.5 font-normal text-faint">
                    · {formatNumber(quality.total_shapes)} labels so far
                  </span>
                )}
              </p>
              {quality && quality.per_class.length > 0 ? (
                <div className="space-y-3">
                  {quality.per_class.map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize text-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                        <span className="font-medium">
                          {formatNumber(c.count)} ({c.share}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c.share}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint">
                  Per-class counts appear here in real time as annotators draw
                  labels — nothing is estimated.
                </p>
              )}
            </Card>
          </div>
        )}

        {tab === "Preview" && <ProjectPreview projectId={id} />}

        {tab === "Download" && (
          <Card className="p-7">
            {project.status === "delivered" ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Your dataset is ready</p>
                  <p className="mt-1 text-sm text-muted">
                    {DELIVERY_FORMATS.find(
                      (f) => f.key === project.delivery_format,
                    )?.label ?? "COCO JSON"}{" "}
                    + quality report PDF
                  </p>
                </div>
                <Button>
                  <Download size={16} /> Download
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Lock size={26} className="text-faint" />
                <p className="mt-3 font-medium">Download unlocks on delivery</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  When your project reaches 100% and passes final QA, your
                  annotation file and quality report appear here.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// Intake panel: live pipeline, detected counts, quote acceptance — and, when
// no data has arrived yet, the upload / Drive-link actions right here.
function IntakeSection({ project }: { project: Project }) {
  const { intake, refresh } = useIntake(project.id);
  const [file, setFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // Seed the error from a ?dataError= handed over when the wizard's upload
  // step failed after the project was already created.
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("dataError");
  });

  const awaiting = intake?.intake_status === "awaiting_data";

  async function sendFile(f: File) {
    setBusy(true);
    setError(null);
    try {
      setUploadPct(0);
      await uploadDataset(project.id, f, setUploadPct, project.total_images);
      setUploadPct(null);
      await refresh();
    } catch {
      setError("Upload failed — please retry.");
      setUploadPct(null);
    } finally {
      setBusy(false);
    }
  }

  async function sendDrive() {
    setBusy(true);
    setError(null);
    try {
      await linkGoogleDrive(project.id, driveLink.trim());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not register the link.");
    } finally {
      setBusy(false);
    }
  }

  if (!intake) return null;

  return (
    <div className="mt-7 space-y-4">
      <Card className="p-6">
        <IntakePipeline intake={intake} />
        {intake.intake_detail && (
          <p className="mt-4 text-sm text-muted">{intake.intake_detail}</p>
        )}
      </Card>

      {!awaiting && <DetectedCounts intake={intake} />}

      {intake.quote && (
        <QuoteCard projectId={project.id} intake={intake} onAccepted={refresh} />
      )}

      {awaiting && (
        <Card className="p-6">
          <p className="font-medium">Add your data to get a firm quote</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                file
                  ? "border-accent/60 bg-accent-soft/40"
                  : "border-line bg-canvas hover:border-accent/50",
              )}
            >
              <UploadCloud size={26} className={file ? "text-accent" : "text-faint"} />
              <p className="mt-2 text-sm font-medium">
                {file ? file.name : "Upload a ZIP"}
              </p>
              <input
                type="file"
                className="sr-only"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f) sendFile(f);
                }}
              />
              {uploadPct !== null && (
                <p className="mt-2 text-xs text-muted">Uploading… {uploadPct}%</p>
              )}
            </label>

            <div className="flex flex-col justify-center gap-2">
              <Field label="Or paste a Google Drive link">
                <Input
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/…"
                />
              </Field>
              <Button
                size="sm"
                variant="secondary"
                onClick={sendDrive}
                disabled={busy || !driveLink.trim()}
                className="self-start"
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Link2 size={15} />
                )}
                Use this link
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </Card>
      )}

      {intake.intake_status === "quote_accepted" && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Check size={15} /> Quote accepted — our team is setting up annotation.
        </p>
      )}
    </div>
  );
}

interface Sample {
  frame: number;
  image: string;
  width: number;
  height: number;
  shapes: { type: string; label: string; color: string; points: number[] }[];
}

function ProjectPreview({ projectId }: { projectId: string }) {
  const [samples, setSamples] = useState<Sample[] | null>(null);

  useEffect(() => {
    api<Sample[]>(`/projects/${projectId}/sample`)
      .then(setSamples)
      .catch(() => setSamples([]));
  }, [projectId]);

  if (samples === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton aspect-video rounded-lg" />
        ))}
      </div>
    );
  }
  if (samples.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon size={28} />}
        title="No approved samples yet"
        description="Once the reviewer approves labeled jobs, verified samples with annotation overlays appear here."
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {samples.map((s, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-line bg-[#1c1917]"
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={`sample ${s.frame}`} className="w-full" />
            <svg
              viewBox={`0 0 ${s.width} ${s.height}`}
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {s.shapes.map((sh, j) => {
                const p = sh.points;
                if (sh.type === "rectangle" && p.length >= 4) {
                  return (
                    <rect
                      key={j}
                      x={Math.min(p[0], p[2])}
                      y={Math.min(p[1], p[3])}
                      width={Math.abs(p[2] - p[0])}
                      height={Math.abs(p[3] - p[1])}
                      fill={`${sh.color}22`}
                      stroke={sh.color}
                      strokeWidth={3}
                    />
                  );
                }
                const pts: string[] = [];
                for (let k = 0; k + 1 < p.length; k += 2)
                  pts.push(`${p[k]},${p[k + 1]}`);
                return (
                  <polygon
                    key={j}
                    points={pts.join(" ")}
                    fill={`${sh.color}22`}
                    stroke={sh.color}
                    strokeWidth={3}
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-canvas">
            <span className="font-mono">frame {s.frame}</span>
            <span>{s.shapes.length} labels</span>
          </div>
        </div>
      ))}
    </div>
  );
}
