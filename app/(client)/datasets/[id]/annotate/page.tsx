"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Box, ImageDetail } from "@/lib/types";

type Draft = { x: number; y: number; w: number; h: number } | null;

export default function AnnotatePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const [imageId, setImageId] = useState<string | null>(
    search.get("image") || null,
  );
  const [detail, setDetail] = useState<ImageDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Load the current image (or the first one if none specified). Never hangs:
  // any failure surfaces as an error rather than an endless spinner.
  const load = useCallback(
    async (imgId: string | null) => {
      setLoadError(null);
      try {
        if (!imgId) {
          const list = await api<{ id: string }[]>(`/datasets/${id}/images`);
          if (list.length === 0) {
            router.replace(`/datasets/${id}`);
            return;
          }
          setImageId(list[0].id);
          return;
        }
        const d = await api<ImageDetail>(`/datasets/${id}/images/${imgId}`);
        setDetail(d);
        setBoxes(d.annotations);
        setSelected(null);
        setDraft(null);
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

  const colorOf = useCallback(
    (label: string) =>
      detail?.labels.find((l) => l.name === label)?.color ?? "#e2553d",
    [detail],
  );

  async function save(): Promise<void> {
    if (!detail) return;
    setSaving(true);
    try {
      await api(`/datasets/${id}/images/${detail.id}/annotations`, {
        method: "PUT",
        body: JSON.stringify({ annotations: boxes, mark_labeled: true }),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function go(dir: "next" | "prev") {
    if (!detail) return;
    if (dirty) await save();
    const target = dir === "next" ? detail.next_id : detail.prev_id;
    if (target) setImageId(target);
  }

  // ── pointer drawing on the stage ─────────────────────────────────────────
  function relPos(e: React.PointerEvent): { x: number; y: number } {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).dataset.box) return; // clicking an existing box
    setSelected(null);
    const p = relPos(e);
    startRef.current = p;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
    stageRef.current!.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
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
    const d = draft;
    startRef.current = null;
    setDraft(null);
    if (d && d.w > 0.01 && d.h > 0.01 && activeLabel) {
      setBoxes((b) => [...b, { label: activeLabel, ...d }]);
      setSelected(boxes.length);
      setDirty(true);
    }
  }

  function removeBox(i: number) {
    setBoxes((b) => b.filter((_, idx) => idx !== i));
    setSelected(null);
    setDirty(true);
  }

  // ── keyboard: 1-9 pick class, Del delete, arrows navigate ────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!detail) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= detail.labels.length) {
        setActiveLabel(detail.labels[n - 1].name);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selected !== null) {
        e.preventDefault();
        removeBox(selected);
      } else if (e.key === "ArrowRight") {
        go("next");
      } else if (e.key === "ArrowLeft") {
        go("prev");
      } else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, selected, boxes, dirty]);

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

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink lg:left-[260px]">
      {/* top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-canvas/10 px-5 py-3 text-canvas">
        <div className="flex items-center gap-3">
          <Link
            href={`/datasets/${id}`}
            className="flex items-center gap-1.5 text-sm text-canvas/60 transition-colors hover:text-canvas"
          >
            <ArrowLeft size={16} /> Dataset
          </Link>
          <span className="text-sm text-canvas/40">·</span>
          <span className="max-w-[220px] truncate text-sm">{detail.filename}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-canvas/50">
            {detail.index + 1} / {detail.total}
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-canvas/15">
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
        <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative max-h-full max-w-full cursor-crosshair select-none"
            style={{ aspectRatio: `${detail.width} / ${detail.height}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.url}
              alt={detail.filename}
              className="pointer-events-none h-full w-full object-contain"
              draggable={false}
            />
            {/* existing boxes */}
            {boxes.map((b, i) => (
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
            {/* live draft */}
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
          </div>
        </div>

        {/* right rail */}
        <aside className="flex w-64 shrink-0 flex-col gap-5 border-l border-canvas/10 bg-ink/95 p-5 text-canvas">
          <div>
            <p className="text-xs uppercase tracking-wide text-canvas/40">
              Classes
            </p>
            <p className="mt-1 text-[11px] text-canvas/40">
              Press 1–{Math.min(detail.labels.length, 9)} · draw to add a box
            </p>
            <div className="mt-3 space-y-1.5">
              {detail.labels.map((l, i) => (
                <button
                  key={l.name}
                  onClick={() => setActiveLabel(l.name)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    activeLabel === l.name
                      ? "bg-canvas/15"
                      : "hover:bg-canvas/[0.07]",
                  )}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-sm"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="flex-1 text-left">{l.name}</span>
                  {i < 9 && (
                    <kbd className="rounded bg-canvas/10 px-1.5 text-[11px] text-canvas/50">
                      {i + 1}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-canvas/[0.06] p-3 text-xs text-canvas/60">
            <p className="flex items-center gap-1.5">
              <Square size={12} /> Drag on the image to draw a box
            </p>
            <p className="mt-1.5 flex items-center gap-1.5">
              <MousePointer2 size={12} /> Click a box to select · Del to remove
            </p>
          </div>

          <div className="mt-auto">
            <p className="text-xs text-canvas/40">
              {boxes.length} box{boxes.length === 1 ? "" : "es"} on this image
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => go("prev")}
                disabled={!detail.prev_id}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-canvas/15 py-2 text-sm text-canvas transition-colors hover:bg-canvas/10 disabled:opacity-30"
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
    </div>
  );
}
