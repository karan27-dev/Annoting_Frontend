"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Loader2,
  MousePointer2,
  Square,
  PenTool,
  Copy,
  Undo2,
  Redo2,
  Ban,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Film,
  Tags,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Box, DatasetImageItem, ImageDetail } from "@/lib/types";

type Draft = { x: number; y: number; w: number; h: number } | null;
type Tool = "select" | "bbox" | "polygon";
type Pt = [number, number];

function polygonBBox(points: Pt[]): { x: number; y: number; w: number; h: number } {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// A video's sampled frames are named "<video>_frame_NNNN.jpg". Group by stem so
// the editor can show them as a scrubbable video timeline.
function videoStem(name: string): string | null {
  const m = name.match(/^(.*)_frame_\d+\.\w+$/i);
  return m ? m[1] : null;
}

export default function AnnotatePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const [imageId, setImageId] = useState<string | null>(
    search.get("image") || null,
  );
  const [detail, setDetail] = useState<ImageDetail | null>(null);
  const [allImages, setAllImages] = useState<DatasetImageItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [history, setHistory] = useState<Box[][]>([]);
  const [future, setFuture] = useState<Box[][]>([]);
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [poly, setPoly] = useState<Pt[]>([]);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [tool, setTool] = useState<Tool>("bbox");
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const toolDefaulted = useRef(false);

  const isClassification = detail?.annotation_type === "classification";

  // ── loading ──────────────────────────────────────────────────────────────
  const load = useCallback(
    async (imgId: string | null) => {
      setLoadError(null);
      try {
        if (!imgId) {
          const list = await api<DatasetImageItem[]>(`/datasets/${id}/images`);
          if (list.length === 0) {
            router.replace(`/datasets/${id}`);
            return;
          }
          setAllImages(list);
          setImageId(list[0].id);
          return;
        }
        const d = await api<ImageDetail>(`/datasets/${id}/images/${imgId}`);
        setDetail(d);
        setBoxes(d.annotations);
        setHistory([]);
        setFuture([]);
        setSelected(null);
        setDraft(null);
        setPoly([]);
        setCursor(null);
        setDirty(false);
        setActiveLabel((cur) => cur || d.labels[0]?.name || "");
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "Could not load this image.",
        );
      }
    },
    [id, router],
  );

  useEffect(() => {
    load(imageId);
  }, [imageId, load]);

  // Fetch the full image list once for the filmstrip.
  useEffect(() => {
    if (allImages) return;
    api<DatasetImageItem[]>(`/datasets/${id}/images`)
      .then(setAllImages)
      .catch(() => setAllImages([]));
  }, [id, allImages]);

  // Default the active tool from the project type, once.
  useEffect(() => {
    if (!detail || toolDefaulted.current) return;
    toolDefaulted.current = true;
    const at = detail.annotation_type;
    setTool(at === "polygon" || at === "segmentation" ? "polygon" : "bbox");
  }, [detail]);

  const colorOf = useCallback(
    (label: string) =>
      detail?.labels.find((l) => l.name === label)?.color ?? "#e2553d",
    [detail],
  );

  // ── history-tracked mutation ───────────────────────────────────────────────
  const commit = useCallback(
    (next: Box[]) => {
      setHistory((h) => [...h, boxes]);
      setFuture([]);
      setBoxes(next);
      setDirty(true);
    },
    [boxes],
  );

  function undo() {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [boxes, ...f]);
    setHistory((h) => h.slice(0, -1));
    setBoxes(prev);
    setSelected(null);
    setDirty(true);
  }
  function redo() {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, boxes]);
    setFuture((f) => f.slice(1));
    setBoxes(next);
    setSelected(null);
    setDirty(true);
  }

  const save = useCallback(async (): Promise<void> => {
    if (!detail) return;
    setSaving(true);
    try {
      await api(`/datasets/${id}/images/${detail.id}/annotations`, {
        method: "PUT",
        body: JSON.stringify({ annotations: boxes, mark_labeled: true }),
      });
      setDirty(false);
      // Keep the filmstrip's labeled dots fresh.
      setAllImages((imgs) =>
        imgs
          ? imgs.map((im) =>
              im.id === detail.id
                ? {
                    ...im,
                    box_count: boxes.length,
                    status: boxes.length ? "labeled" : "unlabeled",
                  }
                : im,
            )
          : imgs,
      );
    } finally {
      setSaving(false);
    }
  }, [detail, id, boxes]);

  const jumpTo = useCallback(
    async (imgId: string | null | undefined) => {
      if (!imgId || imgId === detail?.id) return;
      if (dirty) await save();
      setImageId(imgId);
    },
    [detail, dirty, save],
  );

  async function go(dir: "next" | "prev") {
    if (!detail) return;
    await jumpTo(dir === "next" ? detail.next_id : detail.prev_id);
  }

  // Copy the previous frame's annotations onto this one (Roboflow "Repeat
  // Previous" — the fastest way to track objects across similar frames).
  async function repeatPrevious() {
    if (!detail?.prev_id) return;
    try {
      const prev = await api<ImageDetail>(
        `/datasets/${id}/images/${detail.prev_id}`,
      );
      if (prev.annotations.length) commit(prev.annotations);
    } catch {
      /* ignore — nothing to copy */
    }
  }

  // ── video timeline grouping ────────────────────────────────────────────────
  const group = useMemo(() => {
    if (!detail || !allImages) return [] as DatasetImageItem[];
    const stem = videoStem(detail.filename);
    if (stem === null) return [];
    return allImages.filter((im) => videoStem(im.filename) === stem);
  }, [detail, allImages]);
  const frameIndex = group.findIndex((im) => im.id === detail?.id);

  // Playback: advance one frame at a time while playing.
  useEffect(() => {
    if (!playing) return;
    if (group.length < 2 || frameIndex < 0 || frameIndex >= group.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setImageId(group[frameIndex + 1].id), 650);
    return () => clearTimeout(t);
  }, [playing, group, frameIndex]);

  // ── pointer drawing ────────────────────────────────────────────────────────
  function relPos(e: React.PointerEvent): { x: number; y: number } {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  function closePolygon(pts: Pt[]) {
    if (pts.length < 3 || !activeLabel) {
      setPoly([]);
      setCursor(null);
      return;
    }
    commit([
      ...boxes,
      { label: activeLabel, type: "polygon", points: pts, ...polygonBBox(pts) },
    ]);
    setSelected(boxes.length);
    setPoly([]);
    setCursor(null);
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).dataset.box) return; // clicking an existing shape
    setSelected(null);
    if (isClassification || tool === "select") return;
    const p = relPos(e);

    if (tool === "polygon") {
      if (poly.length >= 3) {
        const r = stageRef.current!.getBoundingClientRect();
        const dx = (p.x - poly[0][0]) * r.width;
        const dy = (p.y - poly[0][1]) * r.height;
        if (Math.hypot(dx, dy) < 12) {
          closePolygon(poly);
          return;
        }
      }
      setPoly((pts) => [...pts, [p.x, p.y]]);
      return;
    }

    // bbox
    startRef.current = p;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
    stageRef.current!.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (tool === "polygon") {
      if (poly.length > 0) {
        const p = relPos(e);
        setCursor([p.x, p.y]);
      }
      return;
    }
    if (!startRef.current) return;
    const p = relPos(e);
    const s = startRef.current;
    setDraft({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    });
  }

  function onPointerUp() {
    if (tool !== "bbox") return;
    const d = draft;
    startRef.current = null;
    setDraft(null);
    if (d && d.w > 0.01 && d.h > 0.01 && activeLabel) {
      commit([...boxes, { label: activeLabel, type: "bbox", ...d }]);
      setSelected(boxes.length);
    }
  }

  function removeBox(i: number) {
    commit(boxes.filter((_, idx) => idx !== i));
    setSelected(null);
  }

  function classify(label: string) {
    commit([{ label, type: "classification", x: 0, y: 0, w: 1, h: 1 }]);
    setActiveLabel(label);
  }

  function pickClass(label: string) {
    if (isClassification) classify(label);
    else setActiveLabel(label);
  }

  // ── keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!detail) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }

      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= detail.labels.length) {
        pickClass(detail.labels[n - 1].name);
      } else if (!isClassification && (e.key === "v" || e.key === "V")) {
        setTool("select");
      } else if (!isClassification && (e.key === "b" || e.key === "B")) {
        setTool("bbox");
      } else if (!isClassification && (e.key === "p" || e.key === "P")) {
        setTool("polygon");
      } else if (!isClassification && (e.key === "r" || e.key === "R")) {
        repeatPrevious();
      } else if (e.key === "Escape" && poly.length > 0) {
        setPoly([]);
        setCursor(null);
      } else if (e.key === "Enter" && poly.length >= 3) {
        closePolygon(poly);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selected !== null) {
        e.preventDefault();
        removeBox(selected);
      } else if (e.key === "ArrowRight") {
        go("next");
      } else if (e.key === "ArrowLeft") {
        go("prev");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, selected, boxes, dirty, poly, tool, activeLabel, history, future, isClassification]);

  if (loadError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-danger">{loadError}</p>
        <div className="flex gap-2">
          <button
            onClick={() => load(imageId)}
            className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas"
          >
            Retry
          </button>
          <Link
            href={`/datasets/${id}`}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Back to dataset
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const pct = detail.total ? Math.round(((detail.index + 1) / detail.total) * 100) : 0;
  const plainBoxes = boxes
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => !b.type || b.type === "bbox");
  const polygons = boxes
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "polygon" && b.points && b.points.length >= 3);
  const currentClass =
    boxes.find((b) => b.type === "classification")?.label ?? null;
  const hasFilmstrip = group.length > 1;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink text-canvas lg:left-[260px]">
      {/* top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3 text-canvas">
        <div className="flex items-center gap-3">
          <Link
            href={`/datasets/${id}`}
            className="flex items-center gap-1.5 text-sm text-canvas/60 transition-colors hover:text-canvas"
          >
            <ArrowLeft size={16} /> Dataset
          </Link>
          <span className="text-sm text-canvas/40">·</span>
          {hasFilmstrip && (
            <span className="hidden items-center gap-1.5 rounded-full bg-canvas/10 px-2.5 py-1 text-[11px] text-canvas/70 sm:inline-flex">
              <Film size={12} /> {videoStem(detail.filename)} · frame{" "}
              {frameIndex + 1}/{group.length}
            </span>
          )}
          <span className="max-w-[200px] truncate text-sm">{detail.filename}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-canvas/50">
            {detail.index + 1} / {detail.total}
          </span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-ink disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {dirty ? "Save" : "Saved"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
          {/* floating tool rail (hidden for classification) */}
          {!isClassification && (
            <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 shadow-lg backdrop-blur">
              <ToolButton
                icon={MousePointer2}
                label="Select (V)"
                active={tool === "select"}
                onClick={() => setTool("select")}
              />
              <ToolButton
                icon={Square}
                label="Bounding box (B)"
                active={tool === "bbox"}
                onClick={() => setTool("bbox")}
              />
              <ToolButton
                icon={PenTool}
                label="Polygon (P)"
                active={tool === "polygon"}
                onClick={() => setTool("polygon")}
              />
              <ToolButton
                icon={Copy}
                label="Repeat previous frame (R)"
                onClick={repeatPrevious}
                disabled={!detail.prev_id}
              />
              <span className="my-0.5 h-px w-6 bg-white/15" />
              <ToolButton
                icon={Undo2}
                label="Undo (⌘Z)"
                onClick={undo}
                disabled={!history.length}
              />
              <ToolButton
                icon={Redo2}
                label="Redo (⌘⇧Z)"
                onClick={redo}
                disabled={!future.length}
              />
              <span className="my-0.5 h-px w-6 bg-white/15" />
              <ToolButton
                icon={Ban}
                label="Clear frame"
                onClick={() => boxes.length && commit([])}
                disabled={!boxes.length}
              />
            </div>
          )}

          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={cn(
              "relative max-h-full max-w-full select-none",
              isClassification || tool === "select"
                ? "cursor-default"
                : "cursor-crosshair",
            )}
            style={{ aspectRatio: `${detail.width} / ${detail.height}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.url}
              alt={detail.filename}
              className="pointer-events-none h-full w-full object-contain"
              draggable={false}
            />

            {/* polygons */}
            {(polygons.length > 0 || poly.length > 0) && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {polygons.map(({ b, i }) => (
                  <polygon
                    key={i}
                    data-box="1"
                    points={b.points!.map(([px, py]) => `${px * 100},${py * 100}`).join(" ")}
                    fill={`${colorOf(b.label)}33`}
                    stroke={selected === i ? "#ffffff" : colorOf(b.label)}
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    className="pointer-events-auto cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                    }}
                  />
                ))}
                {poly.length > 0 && (
                  <polyline
                    points={[...poly, ...(cursor ? [cursor] : [])]
                      .map(([px, py]) => `${px * 100},${py * 100}`)
                      .join(" ")}
                    fill={poly.length >= 3 ? `${colorOf(activeLabel)}22` : "none"}
                    stroke="#ffffff"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            )}

            {/* polygon labels + delete */}
            {polygons.map(({ b, i }) => (
              <span
                key={`lbl-${i}`}
                className="absolute"
                style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
              >
                <span
                  className="absolute -top-[19px] left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: colorOf(b.label) }}
                >
                  {b.label}
                </span>
                {selected === i && (
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      removeBox(i);
                    }}
                    className="absolute -top-[22px] left-full ml-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-danger text-white"
                    aria-label="Delete polygon"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </span>
            ))}

            {/* in-progress polygon vertices */}
            {poly.map(([px, py], vi) => (
              <span
                key={`v-${vi}`}
                className={cn(
                  "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white",
                  vi === 0 && poly.length >= 3 ? "bg-accent" : "bg-ink",
                )}
                style={{ left: `${px * 100}%`, top: `${py * 100}%` }}
              />
            ))}

            {/* bounding boxes */}
            {plainBoxes.map(({ b, i }) => (
              <div
                key={i}
                data-box="1"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelected(i);
                }}
                className={cn(
                  "absolute cursor-pointer",
                  selected === i ? "ring-2 ring-white" : "",
                )}
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                  border: `2px solid ${colorOf(b.label)}`,
                  backgroundColor: `${colorOf(b.label)}22`,
                }}
              >
                <span
                  className="absolute -top-[19px] left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: colorOf(b.label) }}
                >
                  {b.label}
                </span>
                {selected === i && (
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      removeBox(i);
                    }}
                    className="absolute -right-2.5 -top-2.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-danger text-white"
                    aria-label="Delete box"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}

            {/* live bbox draft */}
            {draft && (
              <div
                className="absolute border-2 border-dashed border-white bg-white/10"
                style={{
                  left: `${draft.x * 100}%`,
                  top: `${draft.y * 100}%`,
                  width: `${draft.w * 100}%`,
                  height: `${draft.h * 100}%`,
                }}
              />
            )}

            {/* classification chip */}
            {isClassification && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
                {currentClass ? (
                  <span
                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white shadow-lg"
                    style={{ backgroundColor: colorOf(currentClass) }}
                  >
                    {currentClass}
                  </span>
                ) : (
                  <span className="rounded-full bg-ink/80 px-3.5 py-1.5 text-sm text-canvas/80">
                    Pick a class to label this image
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* right rail */}
        <aside className="flex w-64 shrink-0 flex-col gap-5 border-l border-white/10 bg-ink/95 p-5 text-canvas">
          <div>
            <p className="text-xs uppercase tracking-wide text-canvas/40">Classes</p>
            <p className="mt-1 text-[11px] text-canvas/40">
              {isClassification
                ? `Press 1–${Math.min(detail.labels.length, 9)} · click to label the image`
                : tool === "polygon"
                  ? `Press 1–${Math.min(detail.labels.length, 9)} · click to trace an outline`
                  : tool === "bbox"
                    ? `Press 1–${Math.min(detail.labels.length, 9)} · drag to add a box`
                    : `Press 1–${Math.min(detail.labels.length, 9)} · select & edit shapes`}
            </p>
            <div className="mt-3 space-y-1.5">
              {detail.labels.map((l, i) => {
                const isCurrent = isClassification
                  ? currentClass === l.name
                  : activeLabel === l.name;
                return (
                  <button
                    key={l.name}
                    onClick={() => pickClass(l.name)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      isCurrent ? "bg-white/15" : "hover:bg-white/[0.07]",
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-sm"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 text-left">{l.name}</span>
                    {isClassification && currentClass === l.name && (
                      <Check size={14} className="text-accent" />
                    )}
                    {i < 9 && (
                      <kbd className="rounded bg-canvas/10 px-1.5 text-[11px] text-canvas/50">
                        {i + 1}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-canvas/[0.06] p-3 text-xs text-canvas/60">
            {isClassification ? (
              <>
                <p className="flex items-center gap-1.5">
                  <Tags size={12} /> One class describes the whole image
                </p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <MousePointer2 size={12} /> Click a class or press its number
                </p>
              </>
            ) : tool === "polygon" ? (
              <>
                <p className="flex items-center gap-1.5">
                  <PenTool size={12} /> Click to drop points around the object
                </p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <MousePointer2 size={12} /> Click the first point or press Enter
                  to close · Esc cancels
                </p>
              </>
            ) : tool === "bbox" ? (
              <>
                <p className="flex items-center gap-1.5">
                  <Square size={12} /> Drag on the image to draw a box
                </p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <Copy size={12} /> Repeat previous (R) copies the last frame
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5">
                  <MousePointer2 size={12} /> Click a shape to select · Del removes
                </p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <Undo2 size={12} /> ⌘Z undo · ⌘⇧Z redo
                </p>
              </>
            )}
          </div>

          <div className="mt-auto">
            <p className="text-xs text-canvas/40">
              {isClassification
                ? currentClass
                  ? `Labeled: ${currentClass}`
                  : "Not labeled yet"
                : `${boxes.length} shape${boxes.length === 1 ? "" : "s"} on this frame`}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => go("prev")}
                disabled={!detail.prev_id}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/15 py-2 text-sm text-canvas transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <button
                onClick={() => go("next")}
                disabled={!detail.next_id}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas/90 disabled:opacity-30"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* video filmstrip / timeline */}
      {hasFilmstrip && (
        <div className="border-t border-white/10 bg-ink/95 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={() => jumpTo(group[frameIndex - 1]?.id)}
              disabled={frameIndex <= 0}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-canvas/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              aria-label="Previous frame"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={async () => {
                if (playing) {
                  setPlaying(false);
                } else {
                  if (dirty) await save();
                  setPlaying(true);
                }
              }}
              disabled={frameIndex >= group.length - 1 && !playing}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-ink disabled:opacity-30"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => jumpTo(group[frameIndex + 1]?.id)}
              disabled={frameIndex >= group.length - 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-canvas/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              aria-label="Next frame"
            >
              <SkipForward size={16} />
            </button>
            <span className="ml-1 text-xs text-canvas/50">
              Frame {frameIndex + 1} of {group.length}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {group.map((im, i) => {
              const annotated = im.status !== "unlabeled" || im.box_count > 0;
              return (
                <button
                  key={im.id}
                  onClick={() => jumpTo(im.id)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                    i === frameIndex
                      ? "border-accent"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                  title={`Frame ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                  {annotated && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-success ring-2 ring-ink" />
                  )}
                  <span className="absolute bottom-0 left-0 bg-ink/70 px-1 text-[9px] text-canvas/80">
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Square;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors",
        active
          ? "bg-accent text-white"
          : "text-canvas/70 hover:bg-white/10 hover:text-canvas",
        disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
      )}
    >
      <Icon size={17} />
    </button>
  );
}
