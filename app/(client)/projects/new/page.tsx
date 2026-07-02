"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Spline,
  Layers,
  Locate,
  Tags,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  FileVideo,
  Link2,
  FileJson,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import {
  DetectedCounts,
  IntakePipeline,
  QuoteCard,
  useIntake,
} from "@/components/dashboard/intake";
import { api, ApiError } from "@/lib/api";
import { linkGoogleDrive, uploadDataset } from "@/lib/upload";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import {
  DELIVERY_FORMATS,
  type AnnotationType,
  type DeliveryFormat,
  type LabelClass,
  type MediaType,
} from "@/lib/types";

const TYPES: { key: AnnotationType; label: string; icon: typeof Boxes; rate: number; avg: number }[] = [
  { key: "classification", label: "Classification", icon: Tags, rate: 1.5, avg: 1 },
  { key: "bbox", label: "Bounding box", icon: Boxes, rate: 5, avg: 6 },
  { key: "keypoint", label: "Keypoint", icon: Locate, rate: 8, avg: 4 },
  { key: "polygon", label: "Polygon", icon: Spline, rate: 12, avg: 5 },
  { key: "segmentation", label: "Segmentation", icon: Layers, rate: 18, avg: 4 },
];

const SWATCHES = ["#e2553d", "#2f8f5b", "#c98a17", "#3b6ea5", "#8b5cf6", "#db2777"];

const TURNAROUNDS = [
  { days: 3, label: "3 days", note: "+45% rush" },
  { days: 7, label: "1 week", note: "+20% rush" },
  { days: 14, label: "2 weeks", note: "standard" },
  { days: 30, label: "1 month", note: "standard" },
];

type SourceTab = "upload" | "gdrive";

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // step 1
  const [name, setName] = useState("");
  const [type, setType] = useState<AnnotationType>("bbox");
  const [mediaType, setMediaType] = useState<MediaType>("images");
  const [images, setImages] = useState(2000);
  const [description, setDescription] = useState("");
  const [turnaround, setTurnaround] = useState(14);

  // step 2
  const [labels, setLabels] = useState<LabelClass[]>([
    { name: "object", color: SWATCHES[0], attributes: [] },
  ]);

  // step 3
  const [format, setFormat] = useState<DeliveryFormat>("coco");

  // step 4 — data source + live intake
  const [source, setSource] = useState<SourceTab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { intake } = useIntake(projectId);

  const typeConfig = TYPES.find((t) => t.key === type)!;
  const ballpark = useMemo(() => {
    const totalLabels = Math.round(images * typeConfig.avg);
    const total = Math.round(totalLabels * typeConfig.rate);
    return { totalLabels, total };
  }, [images, typeConfig]);

  function updateLabel(i: number, patch: Partial<LabelClass>) {
    setLabels((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLabel() {
    setLabels((ls) => [
      ...ls,
      { name: "", color: SWATCHES[ls.length % SWATCHES.length], attributes: [] },
    ]);
  }
  function removeLabel(i: number) {
    setLabels((ls) => ls.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const project = await api<{ id: string }>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          annotation_type: type,
          label_taxonomy: labels.filter((l) => l.name.trim()),
          description,
          total_images: images,
          turnaround_days: turnaround,
          media_type: mediaType,
          data_source: source,
          delivery_format: format,
        }),
      });

      if (source === "upload" && file) {
        setUploadPct(0);
        await uploadDataset(project.id, file, setUploadPct, images);
        setUploadPct(null);
      } else if (source === "gdrive" && driveLink.trim()) {
        await linkGoogleDrive(project.id, driveLink.trim());
      } else {
        // No data yet — the project page hosts the upload/Drive actions.
        router.push(`/projects/${project.id}`);
        return;
      }

      // Stay here and show the live intake: counting → quote → accept.
      setProjectId(project.id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create project.",
      );
      setUploadPct(null);
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Dataset", "Labels", "Delivery", "Data & quote"];
  const hasData = source === "upload" ? Boolean(file) : Boolean(driveLink.trim());

  // ── Post-submit: live intake panel ─────────────────────────────────────────
  if (projectId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={name}
          description="Your data is being processed — this usually takes under a minute."
        />
        <div className="space-y-5">
          <Card className="p-6">
            {intake ? (
              <IntakePipeline intake={intake} />
            ) : (
              <div className="skeleton h-8 w-full rounded" />
            )}
            {intake?.intake_detail && (
              <p className="mt-4 text-sm text-muted">{intake.intake_detail}</p>
            )}
          </Card>

          {intake && <DetectedCounts intake={intake} />}

          {intake?.quote && (
            <QuoteCard
              projectId={projectId}
              intake={intake}
              onAccepted={() => router.push(`/projects/${projectId}`)}
            />
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)}>
              Go to project <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New project"
        description="Describe your data, define labels, pick your delivery format, then upload — you'll get a measured quote in about a minute."
      />

      {/* stepper */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  done && "bg-accent text-white",
                  active && "bg-ink text-canvas",
                  !active && !done && "bg-line text-faint",
                )}
              >
                {done ? <Check size={15} /> : n}
              </div>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  active ? "font-medium text-ink" : "text-faint",
                )}
              >
                {s}
              </span>
              {i < steps.length - 1 && <div className="h-px flex-1 bg-line" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 — dataset */}
      {step === 1 && (
        <Card className="space-y-6 p-7">
          <Field label="Project name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Street scenes — vehicle detection"
              autoFocus
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">What are we labeling?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { key: "images", label: "Images", icon: ImageIcon, hint: "JPG, PNG, TIFF…" },
                  { key: "videos", label: "Videos", icon: FileVideo, hint: "MP4, MOV, AVI…" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMediaType(m.key)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                    mediaType === m.key
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-canvas hover:border-accent/40",
                  )}
                >
                  <m.icon
                    size={20}
                    className={mediaType === m.key ? "text-accent-ink" : "text-muted"}
                  />
                  <span>
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-faint">{m.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Annotation type</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors",
                    type === t.key
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-canvas hover:border-accent/40",
                  )}
                >
                  <t.icon
                    size={20}
                    className={type === t.key ? "text-accent-ink" : "text-muted"}
                  />
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-xs text-faint">{formatINR(t.rate)}/label</span>
                </button>
              ))}
            </div>
          </div>

          <Field label={`Estimated files — ${formatNumber(images)}`}>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={images}
              onChange={(e) => setImages(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">Turnaround</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {TURNAROUNDS.map((t) => (
                <button
                  key={t.days}
                  onClick={() => setTurnaround(t.days)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 text-left transition-colors",
                    turnaround === t.days
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-canvas hover:border-accent/40",
                  )}
                >
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-xs text-faint">{t.note}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="What should we label?" hint="Describe the objects and any edge cases.">
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Label every visible car, truck and pedestrian. Mark occluded objects."
            />
          </Field>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2 — labels */}
      {step === 2 && (
        <Card className="space-y-5 p-7">
          <div>
            <h3 className="font-semibold tracking-tightish">Label taxonomy</h3>
            <p className="mt-1 text-sm text-muted">
              Define the classes annotators will use. Pick a color for each.
            </p>
          </div>

          <div className="space-y-3">
            {labels.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3"
              >
                <div className="flex gap-1">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateLabel(i, { color: c })}
                      className={cn(
                        "h-6 w-6 cursor-pointer rounded-full border-2 transition-transform",
                        l.color === c ? "border-ink scale-110" : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`color ${c}`}
                    />
                  ))}
                </div>
                <Input
                  value={l.name}
                  onChange={(e) => updateLabel(i, { name: e.target.value })}
                  placeholder="class name (e.g. car)"
                  className="flex-1"
                />
                <button
                  onClick={() => removeLabel(i)}
                  disabled={labels.length === 1}
                  className="cursor-pointer rounded-lg p-2 text-faint transition-colors hover:bg-ink/5 hover:text-danger disabled:opacity-30"
                  aria-label="Remove label"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={addLabel}>
            <Plus size={15} /> Add class
          </Button>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!labels.some((l) => l.name.trim())}
            >
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3 — delivery format */}
      {step === 3 && (
        <Card className="space-y-5 p-7">
          <div>
            <h3 className="font-semibold tracking-tightish">Delivery format</h3>
            <p className="mt-1 text-sm text-muted">
              Tell us now how you want your labels back — when review finishes,
              delivery is instant in exactly the format your pipeline expects.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {DELIVERY_FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  format === f.key
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-canvas hover:border-accent/40",
                )}
              >
                <FileJson
                  size={20}
                  className={format === f.key ? "text-accent-ink" : "text-muted"}
                />
                <span>
                  <span className="block text-sm font-medium">{f.label}</span>
                  <span className="block text-xs text-faint">{f.hint}</span>
                </span>
                {format === f.key && (
                  <Check size={16} className="ml-auto text-accent-ink" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={() => setStep(4)}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4 — data source + submit */}
      {step === 4 && (
        <div className="space-y-5">
          <Card className="p-7">
            <h3 className="font-semibold tracking-tightish">Send us your data</h3>
            <p className="mt-1 text-sm text-muted">
              Upload a ZIP, or paste a Google Drive link — we count every image
              and video automatically and quote from what we actually find.
            </p>

            {/* source tabs */}
            <div className="mt-4 inline-flex rounded-full border border-line bg-canvas p-1">
              {(
                [
                  { key: "upload", label: "Upload ZIP", icon: UploadCloud },
                  { key: "gdrive", label: "Google Drive link", icon: Link2 },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSource(t.key)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors",
                    source === t.key
                      ? "bg-ink text-canvas"
                      : "text-muted hover:text-ink",
                  )}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              ))}
            </div>

            {source === "upload" ? (
              <label
                className={cn(
                  "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  file
                    ? "border-accent/60 bg-accent-soft/40"
                    : "border-line bg-canvas hover:border-accent/50",
                )}
              >
                <UploadCloud
                  size={32}
                  className={file ? "text-accent" : "text-faint"}
                />
                {file ? (
                  <>
                    <p className="mt-3 text-sm font-medium">{file.name}</p>
                    <p className="mt-1 text-xs text-faint">
                      {(file.size / 1024 / 1024).toFixed(1)} MB · click to change
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-medium">
                      Drop your dataset here, or click to browse
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      ZIP up to 5 GB · images and videos
                    </p>
                  </>
                )}
                <input
                  type="file"
                  className="sr-only"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            ) : (
              <div className="mt-4 space-y-2">
                <Field label="Drive share link" hint="Set the file or folder to “anyone with the link can view”.">
                  <Input
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/…"
                  />
                </Field>
                <p className="text-xs text-faint">
                  We list the folder, count images and videos, and pull a few
                  samples to size complexity — your files stay in your Drive.
                </p>
              </div>
            )}

            {uploadPct !== null && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted">Uploading to secure storage…</span>
                  <span className="font-medium">{uploadPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-faint">
              You can also create the project now and add data later from the
              project page.
            </p>
          </Card>

          <Card className="p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Ballpark estimate</p>
                <p className="display mt-1 text-3xl font-semibold">
                  {formatINR(ballpark.total)}
                </p>
                <p className="mt-1 text-sm text-faint">
                  ~{formatNumber(ballpark.totalLabels)} labels ·{" "}
                  {formatINR(typeConfig.rate)}/label — your firm quote is
                  measured from the data itself after upload
                </p>
              </div>
              <div className="rounded-xl bg-accent-soft px-4 py-3 text-center">
                <p className="text-xs text-accent-ink/70">{typeConfig.label}</p>
                <p className="text-sm font-medium text-accent-ink">
                  {formatNumber(images)} files
                </p>
              </div>
            </div>
          </Card>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {uploadPct !== null ? (
                `Uploading… ${uploadPct}%`
              ) : submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating…
                </>
              ) : hasData ? (
                <>
                  Create & process data <Check size={16} />
                </>
              ) : (
                <>
                  Create project <Check size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
