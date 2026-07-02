"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Box = { x: number; y: number; w: number; h: number; c: number; label?: string };
type Tile = { src: string; name: string; klass: string; boxes: Box[] };

// Boxes are hand-placed on the real (square-cropped) images so they land on the
// actual objects — real imagery, accurate-looking labels.
const TILES: Tile[] = [
  {
    src: "/samples/crowd.jpg",
    name: "event_crowd_2291.jpg",
    klass: "person",
    boxes: [
      { x: 34, y: 49, w: 20, h: 45, c: 96 },
      { x: 1, y: 73, w: 22, h: 27, c: 88 },
      { x: 2, y: 54, w: 16, h: 30, c: 90 },
      { x: 0, y: 45, w: 12, h: 22, c: 83 },
      { x: 44, y: 69, w: 20, h: 31, c: 91 },
      { x: 60, y: 73, w: 22, h: 27, c: 88 },
      { x: 79, y: 41, w: 13, h: 24, c: 86 },
      { x: 90, y: 47, w: 10, h: 22, c: 84 },
      { x: 64, y: 52, w: 10, h: 18, c: 82 },
      { x: 14, y: 45, w: 10, h: 17, c: 85 },
      { x: 22, y: 46, w: 10, h: 17, c: 84 },
      { x: 40, y: 33, w: 7, h: 13, c: 80 },
      { x: 49, y: 31, w: 7, h: 13, c: 81 },
      { x: 57, y: 33, w: 7, h: 13, c: 80 },
      { x: 88, y: 34, w: 7, h: 13, c: 80 },
    ],
  },
  {
    src: "/samples/cyclists.jpg",
    name: "race_peloton_0517.jpg",
    klass: "cyclist",
    boxes: [
      { x: 0, y: 4, w: 27, h: 56, c: 92 },
      { x: 29, y: 17, w: 27, h: 62, c: 94 },
      { x: 49, y: 23, w: 19, h: 48, c: 88 },
      { x: 57, y: 30, w: 16, h: 36, c: 84 },
      { x: 72, y: 25, w: 17, h: 44, c: 89 },
      { x: 84, y: 29, w: 16, h: 48, c: 86 },
      { x: 25, y: 14, w: 15, h: 26, c: 82 },
    ],
  },
  {
    src: "/samples/car.jpg",
    name: "street_vehicle_1148.jpg",
    klass: "vehicle",
    boxes: [
      { x: 1, y: 37, w: 98, h: 51, c: 97, label: "car" },
      { x: 4, y: 66, w: 16, h: 22, c: 90, label: "wheel" },
      { x: 79, y: 65, w: 16, h: 23, c: 91, label: "wheel" },
    ],
  },
];

export function LabeledShowcase() {
  const [tile, setTile] = useState(0);
  const [visible, setVisible] = useState(0);
  const boxes = TILES[tile].boxes;

  useEffect(() => {
    if (visible >= boxes.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 55);
    return () => clearTimeout(t);
  }, [visible, boxes.length]);

  useEffect(() => {
    const t = setTimeout(() => {
      setTile((v) => (v + 1) % TILES.length);
      setVisible(0);
    }, 4600);
    return () => clearTimeout(t);
  }, [tile]);

  const current = TILES[tile];
  const done = visible >= boxes.length;

  // No card/chrome — the labeled image floats transparently on the page.
  return (
    <div className="relative">
      <div className="relative aspect-square w-full overflow-hidden rounded-[20px] shadow-lift">
        {TILES.map((t, i) => (
          <Image
            key={t.src}
            src={t.src}
            alt={`${t.klass} detection sample`}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 560px"
            className={cn(
              "object-cover",
              i === tile ? "opacity-100" : "opacity-0",
            )}
          />
        ))}

        {/* floating filename + IoU chips */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="truncate rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] text-white backdrop-blur-sm">
            {current.name} · {current.klass}
          </span>
          <span
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold backdrop-blur-sm",
              done ? "bg-success/85 text-white" : "bg-warning/85 text-white",
            )}
          >
            {done ? "IoU 0.92" : "detecting…"}
          </span>
        </div>

        {/* detection boxes */}
        <div className="absolute inset-0">
          {boxes.slice(0, visible).map((b, i) => (
            <div
              key={`${tile}-${i}`}
              className="absolute animate-fade-in"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
            >
              <div className="relative h-full w-full rounded-[2px] border-2 border-[#c8f000]">
                <span className="absolute -top-[15px] left-0 whitespace-nowrap rounded-[2px] bg-[#c8f000] px-1 text-[9px] font-semibold leading-[14px] text-black">
                  {b.label ?? current.klass} {b.c}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {TILES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === tile ? "w-5 bg-white" : "w-1.5 bg-white/60",
              )}
            />
          ))}
        </div>
      </div>

      {/* floating QA chip — sits off the image, on the page */}
      <div
        className={cn(
          "absolute -bottom-4 -right-3 hidden rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-lift transition-opacity sm:block",
          done ? "opacity-100" : "opacity-0",
        )}
      >
        <p className="text-[11px] text-faint">Auto-QA passed</p>
        <p className="text-sm font-semibold">
          {boxes.length} {current.klass}s verified
        </p>
      </div>
    </div>
  );
}
