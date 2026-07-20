"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
  Boxes,
  Lock,
  Loader2,
  Plus,
  Layers,
  Check,
  Zap,
  Film,
  Gauge,
  Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import type { DatasetVersion } from "@/lib/types";

// Detector architectures. For video, any YOLO detector below can be paired
// with a tracker (Step 3) so it runs on video with persistent object IDs.
const ARCHS: {
  key: string;
  label: string;
  recommended?: boolean;
  blurb: string[];
  sizes: { key: string; label: string }[];
}[] = [
  {
    key: "rfdetr",
    label: "RF-DETR",
    recommended: true,
    blurb: ["Real-time transformer detector", "Highest accuracy on COCO, converges early"],
    sizes: [
      { key: "n", label: "Nano" },
      { key: "s", label: "Small" },
      { key: "m", label: "Medium" },
      { key: "l", label: "Large" },
      { key: "x", label: "X Large" },
    ],
  },
  {
    key: "yolo11",
    label: "YOLO11",
    blurb: ["Latest Ultralytics YOLO", "Fast CPU + GPU inference"],
    sizes: [
      { key: "n", label: "Nano" },
      { key: "s", label: "Small" },
      { key: "m", label: "Medium" },
      { key: "l", label: "Large" },
      { key: "x", label: "X Large" },
    ],
  },
  {
    key: "yolov8",
    label: "YOLOv8",
    blurb: ["Proven, widely deployed", "Great speed/accuracy balance"],
    sizes: [
      { key: "n", label: "Nano" },
      { key: "s", label: "Small" },
      { key: "m", label: "Medium" },
      { key: "l", label: "Large" },
      { key: "x", label: "X Large" },
    ],
  },
];

/**
 * Recommend a model size based on labeled image count and architecture.
 */
function getRecommendedSize(imageCount: number, archKey: string): string {
  // RF-DETR and YOLO now have the full nano→xlarge spectrum.
  if (imageCount < 80)  return "n";
  if (imageCount < 250) return "s";
  if (imageCount < 700) return "m";
  if (imageCount < 2000) return "l";
  return "x";
}

// Multi-object trackers paired with the detector for video deployment. The
// detector runs per-frame; the tracker keeps a persistent ID on each object
// (Ultralytics model.track). "none" = image-only model.
const TRACKERS: {
  key: string;
  label: string;
  icon: typeof Radar;
  blurb: string;
}[] = [
  { key: "none", label: "Images only", icon: Boxes, blurb: "Per-frame detection, no object IDs" },
  { key: "bytetrack", label: "ByteTrack", icon: Gauge, blurb: "Fast, low overhead — great default" },
  { key: "botsort", label: "BoT-SORT", icon: Radar, blurb: "Re-ID + motion, robust to occlusion" },
];

const SIZE_REASON: Record<string, string> = {
  n: "Very small dataset — Nano trains fast and avoids overfitting.",
  s: "Small dataset — Small gives a good accuracy/speed trade-off.",
  m: "Medium dataset — Medium balances accuracy and training time.",
  l: "Large dataset — Large extracts richer features from your data.",
  x: "Big dataset — X Large squeezes out maximum accuracy.",
};

export default function TrainWizard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [arch, setArch] = useState("rfdetr");
  const [size, setSize] = useState("l");
  const [epochs, setEpochs] = useState(50);
  const [tracker, setTracker] = useState("none");
  const [isVideo, setIsVideo] = useState(false);
  const [versions, setVersions] = useState<DatasetVersion[] | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive the selected version so we can compute recommendations.
  const selectedVersion = versions?.find((v) => v.id === versionId) ?? null;
  const imageCount = selectedVersion?.image_count ?? 0;
  const recommendedSize = getRecommendedSize(imageCount, arch);

  const loadVersions = useCallback(() => {
    api<DatasetVersion[]>(`/datasets/${id}/versions`)
      .then((v) => {
        setVersions(v);
        if (v.length && !versionId) setVersionId(v[0].id);
      })
      .catch(() => setVersions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => loadVersions(), [loadVersions]);

  // Detect a video-derived dataset (frames named "<video>_frame_NNNN") so we
  // can recommend a tracker for deployment.
  useEffect(() => {
    api<{ filename: string }[]>(`/datasets/${id}/images`)
      .then((imgs) => {
        const video = imgs.some((im) => /_frame_\d+\.\w+$/i.test(im.filename));
        setIsVideo(video);
        if (video) setTracker((t) => (t === "none" ? "bytetrack" : t));
      })
      .catch(() => {});
  }, [id]);

  // Auto-select the recommended size whenever the version or architecture changes.
  useEffect(() => {
    if (!versionId) return;
    const activeArch = ARCHS.find((a) => a.key === arch)!;
    const rec = getRecommendedSize(imageCount, arch);
    // Only auto-select if the rec size exists for this arch.
    if (activeArch.sizes.some((s) => s.key === rec)) setSize(rec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId, arch]);

  const activeArch = ARCHS.find((a) => a.key === arch)!;

  async function createVersion() {
    setCreating(true);
    setError(null);
    try {
      const v = await api<DatasetVersion>(`/datasets/${id}/versions`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadVersions();
      setVersionId(v.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create version");
    } finally {
      setCreating(false);
    }
  }

  async function startTraining() {
    if (!versionId) return;
    setStarting(true);
    setError(null);
    try {
      const job = await api<{ id: string }>(`/datasets/${id}/train`, {
        method: "POST",
        body: JSON.stringify({
          version_id: versionId,
          architecture: arch,
          model_size: size,
          epochs,
          tracker: arch === "rfdetr" ? "none" : tracker,
        }),
      });
      router.push(`/datasets/${id}/train/${job.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start training");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link
        href={`/datasets/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to project
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tighter2">
        <Zap size={22} /> Train a model
      </h1>
      <p className="mt-1 text-muted">
        Pick an engine and architecture, choose a dataset version, and start
        training on a free GPU.
      </p>

      {/* Step 1 — Engine */}
      <Section n={1} title="Select engine" done>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-accent bg-accent-soft/40 p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
                <SlidersHorizontal size={18} />
              </span>
              <p className="font-semibold tracking-tightish">Custom Training</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li>• Choose the model architecture</li>
              <li>• Configure model size and epochs</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink/[0.06] text-faint">
                  <Sparkles size={18} />
                </span>
                <p className="font-semibold tracking-tightish">Auto (NAS)</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] text-faint">
                <Lock size={10} /> Soon
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-faint">
              <li>• Automated architecture search</li>
              <li>• Optimized for your dataset</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Step 2 — Architecture */}
      <Section n={2} title="Select architecture" done>
        <div className="grid gap-3 sm:grid-cols-3">
          {ARCHS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setArch(a.key);
                setSize(a.sizes[0].key);
              }}
              className={cn(
                "rounded-2xl border p-4 text-left transition-colors",
                arch === a.key
                  ? "border-accent bg-accent-soft/40"
                  : "border-line bg-surface hover:border-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold tracking-tightish">
                  <Boxes size={17} /> {a.label}
                </span>
                {a.recommended && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                    Recommended
                  </span>
                )}
              </div>
              <ul className="mt-2.5 space-y-1 text-xs text-muted">
                {a.blurb.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        {/* size */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Model size</p>
            {selectedVersion && (
              <p className="text-xs text-muted">
                {imageCount} images in dataset
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeArch.sizes.map((s) => {
              const isRec = s.key === recommendedSize && !!selectedVersion;
              const isSelected = size === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSize(s.key)}
                  className={cn(
                    "relative cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-canvas text-muted hover:border-accent/40",
                  )}
                >
                  {s.label}
                  {isRec && (
                    <span className="absolute -top-2 -right-1 rounded-full bg-accent px-1.5 py-px text-[9px] font-semibold text-white leading-tight">
                      ✓ Best
                    </span>
                  )}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted">Epochs</span>
              <input
                type="number"
                min={1}
                max={300}
                value={epochs}
                onChange={(e) => setEpochs(Math.max(1, Math.min(300, +e.target.value)))}
                className="w-20 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent/50"
              />
            </div>
          </div>
          {/* Recommendation tip */}
          {selectedVersion && (
            <p className="mt-2 text-xs text-muted">
              <span className="font-medium text-accent-ink">
                {activeArch.sizes.find((s) => s.key === recommendedSize)?.label ?? ""} recommended
              </span>
              {" — "}{SIZE_REASON[recommendedSize]}
            </p>
          )}
        </div>
      </Section>

      {/* Step 3 — Video deployment (tracker) */}
      <Section n={3} title="Deploy to video" done>
        <p className="mb-3 text-sm text-muted">
          {isVideo ? (
            <>
              This dataset was sampled from video. Pair your detector with a
              tracker so it keeps a stable ID on each object across frames —
              the model runs on video via{" "}
              <code className="rounded bg-ink/[0.06] px-1 py-0.5 text-[12px]">
                model.track()
              </code>
              .
            </>
          ) : (
            <>
              Optional. Add a multi-object tracker so your model can run on
              video with persistent per-object IDs, not just single frames.
            </>
          )}
        </p>
        {arch === "rfdetr" ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            <Film size={16} className="text-faint" />
            Video tracking runs with YOLO detectors — pick YOLO11 or YOLOv8
            above to enable ByteTrack / BoT-SORT.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {TRACKERS.map((tk) => {
              const rec = isVideo && tk.key === "bytetrack";
              return (
                <button
                  key={tk.key}
                  onClick={() => setTracker(tk.key)}
                  className={cn(
                    "relative rounded-2xl border p-4 text-left transition-colors",
                    tracker === tk.key
                      ? "border-accent bg-accent-soft/40"
                      : "border-line bg-surface hover:border-accent/40",
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold tracking-tightish">
                    <tk.icon size={17} /> {tk.label}
                  </span>
                  <p className="mt-2 text-xs text-muted">{tk.blurb}</p>
                  {rec && (
                    <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                      Recommended
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* Step 4 — Version */}
      <Section n={4} title="Select dataset version" done={Boolean(versionId)}>
        <button
          onClick={createVersion}
          disabled={creating}
          className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-soft/40 disabled:opacity-50"
        >
          {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Create dataset version
        </button>

        {versions === null ? (
          <div className="skeleton h-20 rounded-xl" />
        ) : versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-faint">
            No versions yet. Freeze your labeled images into a version to train on.
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setVersionId(v.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
                  versionId === v.id
                    ? "border-accent bg-accent-soft/40"
                    : "border-line bg-surface hover:border-accent/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold",
                      versionId === v.id ? "bg-accent text-white" : "bg-ink text-canvas",
                    )}
                  >
                    v{v.number}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-faint">
                      {v.train_count} train · {v.valid_count} valid · {v.test_count} test
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Layers size={13} /> {formatNumber(v.image_count)} images
                  {versionId === v.id && <Check size={15} className="text-accent" />}
                </span>
              </button>
            ))}
          </div>
        )}
      </Section>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {/* sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <p className="text-sm text-muted">
            {activeArch.label} · {activeArch.sizes.find((s) => s.key === size)?.label} ·{" "}
            {epochs} epochs
            {arch !== "rfdetr" && tracker !== "none" && (
              <>
                {" · "}
                <span className="text-accent-ink">
                  {TRACKERS.find((t) => t.key === tracker)?.label} tracking
                </span>
              </>
            )}
          </p>
          <Button onClick={startTraining} disabled={!versionId || starting}>
            {starting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Start training
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            done ? "bg-accent text-white" : "bg-ink/[0.08] text-muted",
          )}
        >
          {done ? <Check size={13} /> : n}
        </span>
        <h2 className="font-semibold tracking-tightish">{title}</h2>
      </div>
      {children}
    </div>
  );
}
