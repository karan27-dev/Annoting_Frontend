"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Boxes, Layers, Spline, Locate, Film, ImageIcon, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LIME = "#c8f000";

// ── Accurate overlays, hand-placed on each real image ────────────────────────

// Person boxes on crowd.jpg (same coords as the hero).
const CROWD_BOXES = [
  [34, 49, 20, 45], [1, 73, 22, 27], [2, 54, 16, 30], [0, 45, 12, 22],
  [44, 69, 20, 31], [60, 73, 22, 27], [79, 41, 13, 24], [64, 52, 10, 18],
  [14, 45, 10, 17], [22, 46, 10, 17], [40, 33, 7, 13], [88, 34, 7, 13],
];
function CrowdBoxes() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      {CROWD_BOXES.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke={LIME} strokeWidth="0.6" rx="0.4" />
      ))}
    </svg>
  );
}

// BMW side-profile silhouette on car.jpg.
const CAR_SIL = "2,58 10,50 22,44 31,41 46,38 54,39 62,43 80,48 92,51 98,57 98,72 88,80 14,80 4,74";
function CarMask() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <polygon points={CAR_SIL} fill={`${LIME}55`} stroke={LIME} strokeWidth="0.7" />
    </svg>
  );
}
function CarPolygon() {
  const pts = CAR_SIL.split(" ").map((p) => p.split(",").map(Number));
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <polygon points={CAR_SIL} fill="none" stroke={LIME} strokeWidth="0.7" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#fff" stroke={LIME} strokeWidth="0.5" />
      ))}
    </svg>
  );
}

// Skeleton on the front rider of cyclists.jpg.
const JOINTS: Record<string, [number, number]> = {
  head: [42, 21], neck: [42, 28], lsh: [35, 30], rsh: [49, 30], lel: [32, 40],
  rel: [52, 40], lwr: [33, 52], rwr: [52, 52], hip: [43, 53], lkn: [37, 63],
  rkn: [48, 61], lan: [35, 73], ran: [47, 71],
};
const BONES: [string, string][] = [
  ["head", "neck"], ["neck", "lsh"], ["neck", "rsh"], ["lsh", "lel"], ["lel", "lwr"],
  ["rsh", "rel"], ["rel", "rwr"], ["neck", "hip"], ["hip", "lkn"], ["lkn", "lan"],
  ["hip", "rkn"], ["rkn", "ran"],
];
function CyclistPose() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      {BONES.map(([a, b], i) => (
        <line key={i} x1={JOINTS[a][0]} y1={JOINTS[a][1]} x2={JOINTS[b][0]} y2={JOINTS[b][1]} stroke={LIME} strokeWidth="0.7" />
      ))}
      {Object.values(JOINTS).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill={LIME} stroke="#000" strokeWidth="0.3" />
      ))}
    </svg>
  );
}

type Modality = {
  key: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  image: string;
  render: () => React.ReactNode;
};

const IMAGE_MODES: Modality[] = [
  {
    key: "bbox",
    icon: Boxes,
    title: "Detect objects with bounding boxes",
    desc: "Draw tight rectangles around every object — the workhorse for object-detection datasets.",
    image: "/samples/crowd.jpg",
    render: CrowdBoxes,
  },
  {
    key: "mask",
    icon: Layers,
    title: "Segment scenes with pixel-level masks",
    desc: "Pixel-accurate masks that trace the exact silhouette of each object.",
    image: "/samples/car.jpg",
    render: CarMask,
  },
  {
    key: "polygon",
    icon: Spline,
    title: "Segment instances with polygons",
    desc: "Vertex-by-vertex instance outlines that hug each object's true shape.",
    image: "/samples/car.jpg",
    render: CarPolygon,
  },
  {
    key: "keypoint",
    icon: Locate,
    title: "Estimate poses with keypoints & skeletons",
    desc: "Landmark points and connected skeletons for pose and structure estimation.",
    image: "/samples/cyclists.jpg",
    render: CyclistPose,
  },
];

function VideoTrack() {
  const frames = ["/samples/pithole-1.jpg", "/samples/pithole-2.jpg", "/samples/pithole-3.jpg", "/samples/pithole-4.jpg"];
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-2">
      {frames.map((f, i) => (
        <div key={f} className="relative overflow-hidden rounded-lg">
          <Image src={f} alt={`frame ${i + 1}`} fill sizes="280px" className="object-cover" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <rect x={34 + i * 5} y={40} width={16} height={18} fill="none" stroke={LIME} strokeWidth="1" rx="1" />
          </svg>
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
            frame {i + 1} · ID 42
          </span>
        </div>
      ))}
    </div>
  );
}

export function Capabilities() {
  const [tab, setTab] = useState<"images" | "video">("images");
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = IMAGE_MODES[mode];

  useEffect(() => {
    if (paused || tab !== "images") return;
    const t = setTimeout(() => setMode((m) => (m + 1) % IMAGE_MODES.length), 3600);
    return () => clearTimeout(t);
  }, [mode, paused, tab]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <TabPill active={tab === "images"} onClick={() => setTab("images")} icon={ImageIcon}>
          Images
        </TabPill>
        <TabPill active={tab === "video"} onClick={() => { setTab("video"); setPaused(true); }} icon={Video}>
          Video
        </TabPill>
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-faint">
          <Film size={15} /> 3D &amp; Audio — coming soon
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-2">
          {tab === "images" ? (
            IMAGE_MODES.map((m, i) => (
              <button
                key={m.key}
                onClick={() => { setMode(i); setPaused(true); }}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  i === mode ? "border-accent bg-surface shadow-soft" : "border-line bg-surface/60 hover:border-accent/40",
                )}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", i === mode ? "bg-accent text-white" : "bg-ink/[0.06] text-muted")}>
                  <m.icon size={18} />
                </span>
                <span>
                  <span className="block font-medium tracking-tightish">{m.title}</span>
                  {i === mode && <span className="mt-1 block text-sm text-muted">{m.desc}</span>}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-accent bg-surface p-5 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
                <Video size={18} />
              </span>
              <p className="mt-3 font-medium tracking-tightish">Track objects across frames</p>
              <p className="mt-1 text-sm text-muted">
                Consistent object IDs frame-to-frame with interpolation between keyframes — for tracking, ADAS and video analytics datasets.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {["Persistent track IDs", "Keyframe interpolation", "Per-frame QA scoring"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-[#1c1917] shadow-lift">
          {tab === "images" ? (
            <div className="relative aspect-[4/3] w-full">
              <Image key={active.image} src={active.image} alt={active.title} fill sizes="640px" className="object-cover" />
              {active.render()}
            </div>
          ) : (
            <div className="aspect-[4/3] w-full">
              <VideoTrack />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabPill({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-ink text-canvas" : "border border-line bg-surface text-muted hover:text-ink",
      )}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}
