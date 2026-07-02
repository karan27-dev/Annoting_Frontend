"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  X,
  ExternalLink,
  Layers,
  ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/form";
import { QualityBadge } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

const FORMAT_LABEL: Record<string, string> = {
  coco: "COCO JSON",
  yolo: "YOLO TXT",
  voc: "Pascal VOC XML",
  cvat_xml: "CVAT XML",
  datumaro: "Datumaro JSON",
};

interface Detail {
  assignment_id: string;
  cvat_job_id: number;
  annotator_name: string;
  project_name: string;
  annotation_type: string;
  delivery_format: string;
  iou_score: number | null;
  reason: string;
  status: string;
  frame_count: number;
  deep_link: string;
  cvat_available: boolean;
  start_frame: number;
  stop_frame: number;
  total_shapes: number;
  shape_summary: Record<string, number>;
  labels: { name: string; color: string }[];
}
interface Shape {
  type: string;
  label: string;
  color: string;
  points: number[];
}
interface Frame {
  frame: number;
  image: string;
  width: number;
  height: number;
  shapes: Shape[];
}

export default function ReviewItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [frameNo, setFrameNo] = useState<number | null>(null);
  const [loadingFrame, setLoadingFrame] = useState(false);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api<Detail>(`/reviewer/queue/${id}`)
      .then((d) => {
        setDetail(d);
        setFrameNo(d.start_frame);
      })
      .catch(() => setDetail(null));
  }, [id]);

  const loadFrame = useCallback(
    (n: number) => {
      setLoadingFrame(true);
      api<Frame>(`/reviewer/queue/${id}/frame/${n}`)
        .then(setFrame)
        .catch(() => setFrame(null))
        .finally(() => setLoadingFrame(false));
    },
    [id],
  );

  useEffect(() => {
    if (frameNo !== null) loadFrame(frameNo);
  }, [frameNo, loadFrame]);

  async function act(action: "approve" | "revise" | "reject") {
    setActing(true);
    try {
      await api(`/reviewer/queue/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      router.push("/reviewer/queue");
    } finally {
      setActing(false);
    }
  }

  if (!detail) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  const canPrev = frameNo !== null && frameNo > detail.start_frame;
  const canNext = frameNo !== null && frameNo < detail.stop_frame;

  return (
    <div className="mx-auto max-w-6xl">
      <button
        onClick={() => router.push("/reviewer/queue")}
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to queue
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter2">
            {detail.project_name}
          </h1>
          <p className="mt-1 text-muted">
            {TYPE_LABEL[detail.annotation_type]} · by{" "}
            <span className="font-medium text-ink">{detail.annotator_name}</span>{" "}
            · Job #{detail.cvat_job_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {detail.iou_score != null && <QualityBadge iou={detail.iou_score} />}
          <Badge tone="warning">{detail.reason}</Badge>
          <Badge tone="accent">
            Delivers as {FORMAT_LABEL[detail.delivery_format] ?? "COCO JSON"}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* viewer */}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-xs text-faint">
              frame {frame?.frame ?? frameNo} of {detail.start_frame}–
              {detail.stop_frame}
              {frame ? ` · ${frame.shapes.length} labels` : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => canPrev && setFrameNo((n) => (n ?? 0) - 1)}
                disabled={!canPrev}
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => canNext && setFrameNo((n) => (n ?? 0) + 1)}
                disabled={!canNext}
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center bg-[#1c1917] p-3">
            {loadingFrame && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/40">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
            {frame ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.image}
                  alt={`frame ${frame.frame}`}
                  className="max-h-[62vh] w-auto rounded"
                />
                <svg
                  viewBox={`0 0 ${frame.width} ${frame.height}`}
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {frame.shapes.map((s, i) => (
                    <ShapeEl key={i} shape={s} />
                  ))}
                </svg>
              </div>
            ) : detail.cvat_available ? (
              <div className="py-24 text-center text-sm text-white/60">
                <ImageIcon size={26} className="mx-auto mb-2 opacity-60" />
                No image for this frame
              </div>
            ) : (
              <div className="py-24 text-center text-sm text-white/60">
                Canvas engine (CVAT) is offline — start it to load frames.
              </div>
            )}
          </div>
        </Card>

        {/* side panel */}
        <div className="space-y-5">
          <Card>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Layers size={15} /> Annotation layers
            </p>
            <p className="mt-1 text-xs text-faint">
              {formatNumber(detail.total_shapes)} shapes across{" "}
              {detail.frame_count} images
            </p>
            <div className="mt-4 space-y-2">
              {Object.keys(detail.shape_summary).length === 0 ? (
                <p className="text-sm text-muted">No labels submitted yet.</p>
              ) : (
                Object.entries(detail.shape_summary).map(([label, count]) => {
                  const color =
                    detail.labels.find((l) => l.name === label)?.color ??
                    "#e2553d";
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })
              )}
            </div>
            <a href={detail.deep_link} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm" className="mt-4 w-full">
                <ExternalLink size={14} /> Open in canvas
              </Button>
            </a>
          </Card>

          <Card>
            <p className="text-sm font-medium">Decision</p>
            <Textarea
              className="mt-3"
              rows={3}
              placeholder="Notes to the annotator (optional)…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-3 space-y-2">
              <Button
                className="w-full"
                onClick={() => act("approve")}
                disabled={acting}
              >
                <Check size={15} /> Approve &amp; send to client
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => act("revise")}
                  disabled={acting}
                >
                  <RotateCcw size={14} /> Revise
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => act("reject")}
                  disabled={acting}
                >
                  <X size={14} /> Reject
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShapeEl({ shape }: { shape: Shape }) {
  const p = shape.points;
  if (shape.type === "rectangle" && p.length >= 4) {
    const [x1, y1, x2, y2] = p;
    return (
      <rect
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)}
        height={Math.abs(y2 - y1)}
        fill={`${shape.color}22`}
        stroke={shape.color}
        strokeWidth={3}
      />
    );
  }
  // polygon / polyline / points
  const pts: string[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) pts.push(`${p[i]},${p[i + 1]}`);
  if (shape.type === "points") {
    return (
      <>
        {pts.map((pt, i) => {
          const [cx, cy] = pt.split(",");
          return <circle key={i} cx={cx} cy={cy} r={5} fill={shape.color} />;
        })}
      </>
    );
  }
  return (
    <polygon
      points={pts.join(" ")}
      fill={`${shape.color}22`}
      stroke={shape.color}
      strokeWidth={3}
    />
  );
}
