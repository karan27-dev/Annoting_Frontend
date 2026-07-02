"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatINR, formatNumber } from "@/lib/utils";

// Mirrors the backend pricing engine rate card (₹ per label) for an instant
// client-side ballpark. The firm quote still comes from POST /pricing/quote.
const RATES: Record<string, { rate: number; avgObjects: number; label: string }> = {
  classification: { rate: 1.5, avgObjects: 1, label: "Classification" },
  bbox: { rate: 5, avgObjects: 6, label: "Bounding box" },
  keypoint: { rate: 8, avgObjects: 4, label: "Keypoint" },
  polygon: { rate: 12, avgObjects: 5, label: "Polygon" },
  segmentation: { rate: 18, avgObjects: 4, label: "Segmentation" },
};

const TURNAROUNDS = [
  { days: 14, label: "Standard · 14 days", premium: 0 },
  { days: 7, label: "Priority · 7 days", premium: 0.2 },
  { days: 3, label: "Rush · 3 days", premium: 0.45 },
];

function volumeDiscount(labels: number) {
  if (labels >= 500_000) return 0.2;
  if (labels >= 100_000) return 0.12;
  if (labels >= 25_000) return 0.06;
  return 0;
}

export function QuoteEstimator() {
  const [type, setType] = useState("bbox");
  const [images, setImages] = useState(5000);
  const [turnaround, setTurnaround] = useState(14);

  const config = RATES[type];
  const tConfig = TURNAROUNDS.find((t) => t.days === turnaround)!;
  const labels = Math.round(images * config.avgObjects);
  const discount = volumeDiscount(labels);
  const base = labels * config.rate;
  const afterRush = base * (1 + tConfig.premium);
  const total = Math.round(afterRush * (1 - discount));

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid md:grid-cols-[1.3fr_1fr]">
        {/* controls */}
        <div className="border-b border-line p-7 md:border-b-0 md:border-r">
          <h3 className="text-lg font-semibold tracking-tightish">
            Instant quote estimator
          </h3>
          <p className="mt-1 text-sm text-muted">
            A ballpark in seconds. No account needed.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <label className="text-sm font-medium">Annotation type</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(RATES).map(([key, v]) => (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      type === key
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-canvas hover:border-accent/40"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Number of images</label>
                <span className="font-mono text-sm text-muted">
                  {formatNumber(images)}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={200000}
                step={500}
                value={images}
                onChange={(e) => setImages(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Turnaround</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TURNAROUNDS.map((t) => (
                  <button
                    key={t.days}
                    onClick={() => setTurnaround(t.days)}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition-colors ${
                      turnaround === t.days
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-canvas hover:border-accent/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* result */}
        <div className="flex flex-col justify-between bg-ink p-7 text-canvas">
          <div>
            <p className="text-sm text-canvas/60">Estimated total</p>
            <p className="display mt-1 text-4xl font-semibold">
              {formatINR(total)}
            </p>
            <p className="mt-1 text-sm text-canvas/60">
              ~{formatNumber(labels)} labels · {formatINR(config.rate)}/label
            </p>

            <dl className="mt-7 space-y-2.5 text-sm">
              <Row k={`${config.label} base`} v={formatINR(Math.round(base))} />
              {tConfig.premium > 0 && (
                <Row
                  k={`Rush premium (+${Math.round(tConfig.premium * 100)}%)`}
                  v={`+${formatINR(Math.round(base * tConfig.premium))}`}
                />
              )}
              {discount > 0 && (
                <Row
                  k={`Volume discount (−${Math.round(discount * 100)}%)`}
                  v={`−${formatINR(Math.round(afterRush * discount))}`}
                  good
                />
              )}
            </dl>
          </div>
          <p className="mt-7 text-xs leading-relaxed text-canvas/50">
            Estimate only. Final pricing is confirmed after upload, based on
            actual object counts. GST added at invoicing.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Row({ k, v, good }: { k: string; v: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
      <dt className="text-canvas/60">{k}</dt>
      <dd className={good ? "text-success" : "text-canvas"}>{v}</dd>
    </div>
  );
}
