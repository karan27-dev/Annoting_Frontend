"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  ImagePlus,
  Download,
  PenLine,
  CheckCircle2,
  Loader2,
  Boxes,
  Database,
  Layers,
  ArrowRight,
  Cpu,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { uploadDatasetImages } from "@/lib/upload";
import { cn, formatNumber } from "@/lib/utils";
import type { DatasetImageItem, DatasetSummary } from "@/lib/types";

type Section =
  | "upload"
  | "annotate"
  | "dataset"
  | "versions"
  | "train"
  | "models";

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [images, setImages] = useState<DatasetImageItem[] | null>(null);
  const [section, setSection] = useState<Section>("annotate");
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    api<DatasetSummary>(`/datasets/${id}`).then(setSummary).catch(() => setSummary(null));
    api<DatasetImageItem[]>(`/datasets/${id}/images`)
      .then(setImages)
      .catch(() => setImages([]));
  }, [id]);

  useEffect(() => refresh(), [refresh]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(0);
    try {
      await uploadDatasetImages(id, Array.from(files), setUploading);
      refresh();
      setSection("annotate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function exportDataset(fmt: "coco" | "yolo") {
    api<unknown>(`/datasets/${id}/export?fmt=${fmt}`).then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${summary?.name ?? "dataset"}-${fmt}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const unlabeled = images?.filter((i) => i.status === "unlabeled") ?? [];
  const labeled = images?.filter((i) => i.status !== "unlabeled") ?? [];
  const total = images?.length ?? 0;
  const firstUnlabeled = unlabeled[0] ?? images?.[0];
  const annotateHref = firstUnlabeled
    ? `/datasets/${id}/annotate?image=${firstUnlabeled.id}`
    : `/datasets/${id}/annotate`;
  const thumb = images?.[0]?.url;

  const DATA_NAV: { key: Section; label: string; icon: typeof Boxes; badge?: number }[] = [
    { key: "upload", label: "Upload Data", icon: UploadCloud },
    { key: "annotate", label: "Annotate", icon: PenLine },
    { key: "dataset", label: "Dataset", icon: Database, badge: total },
    { key: "versions", label: "Versions", icon: Layers },
  ];
  const MODEL_NAV: { key: Section; label: string; icon: typeof Boxes }[] = [
    { key: "train", label: "Train", icon: Cpu },
    { key: "models", label: "Models", icon: Rocket },
  ];

  return (
    <div className="-mx-5 -my-7 flex min-h-[calc(100vh-1px)] sm:-mx-8 sm:-my-9">
      {/* project sub-nav */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 pt-5 text-xs font-medium uppercase tracking-wide text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} /> Projects
        </Link>
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="h-11 w-11 overflow-hidden rounded-lg border border-line bg-ink">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-accent-soft">
                <Boxes size={20} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{summary?.name ?? "…"}</p>
            <p className="text-xs capitalize text-faint">
              {summary?.annotation_type ?? "bbox"} · self-serve
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Data
          </p>
          {DATA_NAV.map((n) => (
            <SubNavItem
              key={n.key}
              active={section === n.key}
              onClick={() => setSection(n.key)}
              icon={n.icon}
              label={n.label}
              badge={n.badge}
            />
          ))}
          <p className="mt-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Models
          </p>
          {MODEL_NAV.map((n) => (
            <SubNavItem
              key={n.key}
              active={section === n.key}
              onClick={() => setSection(n.key)}
              icon={n.icon}
              label={n.label}
            />
          ))}
        </nav>
      </aside>

      {/* main content */}
      <div className="min-w-0 flex-1 p-5 sm:p-8">
        {/* mobile section switch */}
        <div className="mb-4 flex gap-1 overflow-x-auto md:hidden">
          {[...DATA_NAV, ...MODEL_NAV].map((n) => (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
                section === n.key ? "bg-ink text-canvas" : "bg-surface text-muted",
              )}
            >
              {n.label}
            </button>
          ))}
        </div>

        {section === "annotate" && (
          <AnnotateBoard
            id={id}
            unlabeled={unlabeled}
            labeled={labeled}
            total={total}
            annotateHref={annotateHref}
            onUpload={() => setSection("upload")}
            onExport={exportDataset}
            hasBoxes={(summary?.total_boxes ?? 0) > 0}
          />
        )}

        {section === "upload" && (
          <UploadPanel
            uploading={uploading}
            error={error}
            fileRef={fileRef}
            onFiles={onFiles}
          />
        )}

        {section === "dataset" && (
          <DatasetPanel
            id={id}
            images={images}
            summary={summary}
            onExport={exportDataset}
          />
        )}

        {section === "versions" && (
          <Placeholder
            icon={<Layers size={26} />}
            title="Dataset versions"
            body="Freeze a snapshot of your labeled images to train or share. Export the current state below — versioned snapshots are coming next."
            action={
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={() => exportDataset("coco")} disabled={(summary?.total_boxes ?? 0) === 0}>
                  <Download size={15} /> Export COCO
                </Button>
                <Button size="sm" variant="secondary" onClick={() => exportDataset("yolo")} disabled={(summary?.total_boxes ?? 0) === 0}>
                  <Download size={15} /> Export YOLO
                </Button>
              </div>
            }
          />
        )}

        {section === "train" && (
          <Placeholder
            icon={<Cpu size={26} />}
            title="Train a model"
            body={`Once your dataset has labeled images, you'll be able to train a detection model on it. You have ${formatNumber(labeled.length)} labeled image${labeled.length === 1 ? "" : "s"} so far.`}
          />
        )}
        {section === "models" && (
          <Placeholder
            icon={<Rocket size={26} />}
            title="Models"
            body="Trained models will appear here with their accuracy metrics. Train your first model from a labeled dataset."
          />
        )}
      </div>
    </div>
  );
}

function SubNavItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Boxes;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-ink/[0.04] hover:text-ink",
      )}
    >
      <Icon size={16} className={active ? "text-accent-ink" : "text-faint"} />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-ink/[0.06] px-1.5 text-xs text-muted">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Annotate board: Unassigned → Annotating → Dataset ─────────────────────── */
function AnnotateBoard({
  id,
  unlabeled,
  labeled,
  total,
  annotateHref,
  onUpload,
  onExport,
  hasBoxes,
}: {
  id: string;
  unlabeled: DatasetImageItem[];
  labeled: DatasetImageItem[];
  total: number;
  annotateHref: string;
  onUpload: () => void;
  onExport: (f: "coco" | "yolo") => void;
  hasBoxes: boolean;
}) {
  const pct = total ? Math.round((labeled.length / total) * 100) : 0;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tighter2">
          <PenLine size={20} /> Annotate
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onUpload}>
            <UploadCloud size={15} /> Upload more
          </Button>
          <Link href={annotateHref}>
            <Button size="sm">
              <PenLine size={15} /> Start annotating
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Unassigned */}
        <BoardColumn title="Unassigned" count={`${unlabeled.length} images`}>
          {unlabeled.length === 0 ? (
            <ColumnEmpty label="Nothing waiting" />
          ) : (
            <div className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-medium">Unlabeled batch</p>
              <p className="mt-0.5 text-sm text-faint">
                {formatNumber(unlabeled.length)} image
                {unlabeled.length === 1 ? "" : "s"} to annotate
              </p>
              <Link
                href={annotateHref}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline"
              >
                Annotate images <ArrowRight size={14} />
              </Link>
            </div>
          )}
          <button
            onClick={onUpload}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-3 text-sm text-muted transition-colors hover:border-accent/50 hover:text-ink"
          >
            <ImagePlus size={15} /> Upload more images
          </button>
        </BoardColumn>

        {/* Annotating — live progress on the whole set */}
        <BoardColumn title="Annotating" count={total ? "1 job" : "0 jobs"}>
          {total === 0 ? (
            <ColumnEmpty label="Upload images to begin" />
          ) : (
            <div className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-medium">This dataset</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{labeled.length} annotated</span>
                  <span>{unlabeled.length} left</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <Link
                href={annotateHref}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline"
              >
                {unlabeled.length > 0 ? "Continue" : "Review"} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </BoardColumn>

        {/* Dataset — the labeled, export-ready set */}
        <BoardColumn title="Dataset" count={`${labeled.length} labeled`}>
          {labeled.length === 0 ? (
            <ColumnEmpty label="Finished labels land here" />
          ) : (
            <div className="rounded-xl border border-line bg-canvas p-3">
              <div className="grid grid-cols-3 gap-1.5">
                {labeled.slice(0, 6).map((img) => (
                  <Link
                    key={img.id}
                    href={`/datasets/${id}/annotate?image=${img.id}`}
                    className="relative overflow-hidden rounded-md bg-ink"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                  </Link>
                ))}
              </div>
              {labeled.length > 6 && (
                <p className="mt-2 text-center text-xs text-faint">
                  +{labeled.length - 6} more
                </p>
              )}
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => onExport("coco")} disabled={!hasBoxes}>
                  <Download size={14} /> COCO
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => onExport("yolo")} disabled={!hasBoxes}>
                  <Download size={14} /> YOLO
                </Button>
              </div>
            </div>
          )}
        </BoardColumn>
      </div>
    </div>
  );
}

function BoardColumn({
  title,
  count,
  children,
}: {
  title: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 text-center">
        <p className="font-semibold tracking-tightish">{title}</p>
        <p className="text-xs text-faint">{count}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ColumnEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-faint">
      {label}
    </div>
  );
}

/* ── Upload panel ──────────────────────────────────────────────────────────── */
function UploadPanel({
  uploading,
  error,
  fileRef,
  onFiles,
}: {
  uploading: number | null;
  error: string | null;
  fileRef: React.RefObject<HTMLInputElement>;
  onFiles: (f: FileList | null) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tighter2">
        <UploadCloud size={20} /> Upload data
      </h1>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors",
          uploading !== null ? "border-accent/60 bg-accent-soft/40" : "border-line bg-surface hover:border-accent/50",
        )}
      >
        {uploading !== null ? (
          <>
            <Loader2 size={30} className="animate-spin text-accent" />
            <p className="mt-3 text-sm text-muted">Uploading… {uploading}%</p>
          </>
        ) : (
          <>
            <UploadCloud size={30} className="text-faint" />
            <p className="mt-3 font-medium">Drop images here, or click to browse</p>
            <p className="mt-1 text-xs text-faint">JPG, PNG, WEBP · as many as you like</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}

/* ── Dataset panel: full grid + class distribution + export ────────────────── */
function DatasetPanel({
  id,
  images,
  summary,
  onExport,
}: {
  id: string;
  images: DatasetImageItem[] | null;
  summary: DatasetSummary | null;
  onExport: (f: "coco" | "yolo") => void;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tighter2">
          <Database size={20} /> Dataset
        </h1>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => onExport("coco")} disabled={(summary?.total_boxes ?? 0) === 0}>
            <Download size={15} /> COCO
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onExport("yolo")} disabled={(summary?.total_boxes ?? 0) === 0}>
            <Download size={15} /> YOLO
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div>
          {images === null ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton aspect-square rounded-lg" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-faint">
              No images yet — upload some to get started.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {images.map((img) => (
                <Link
                  key={img.id}
                  href={`/datasets/${id}/annotate?image=${img.id}`}
                  className="group relative overflow-hidden rounded-lg border border-line bg-ink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-1 top-1">
                    {img.status !== "unlabeled" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <CheckCircle2 size={9} /> {img.box_count}
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-canvas">
                        new
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Classes</p>
          {summary && summary.classes.length > 0 ? (
            <div className="mt-3 space-y-3">
              {summary.classes.map((c) => {
                const max = Math.max(...summary.classes.map((x) => x.count), 1);
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 capitalize text-muted">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{formatNumber(c.count)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-faint">Draw boxes to see class counts.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Placeholder({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
        {icon}
      </div>
      <p className="mt-4 font-semibold tracking-tightish">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
