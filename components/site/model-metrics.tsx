import { Counter } from "@/components/site/counter";
import { Reveal } from "@/components/site/reveal";

const METRICS = [
  { label: "mAP@50", value: 98.8, color: "#8b5cf6", soft: "#8b5cf618" },
  { label: "Precision", value: 98.6, color: "#3b6ea5", soft: "#3b6ea518" },
  { label: "Recall", value: 98.2, color: "#c98a17", soft: "#c98a1718" },
  { label: "F1", value: 98.4, color: "#2f8f5b", soft: "#2f8f5b18" },
];

// A smooth rising training curve (mAP over epochs) as an SVG sparkline.
const CURVE = [12, 34, 55, 68, 77, 84, 89, 92, 95, 97, 98, 98.5, 98.8];

function TrainingCurve() {
  const w = 100;
  const h = 42;
  const pts = CURVE.map((v, i) => {
    const x = (i / (CURVE.length - 1)) * w;
    const y = h - (v / 100) * h;
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mcurve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#mcurve)" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ModelMetrics() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-soft sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-ink">
            Proof, not promises
          </p>
          <h3 className="display mt-3 text-3xl font-semibold sm:text-4xl">
            Models trained on our labels score higher
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            A YOLO detector trained on an Annoting-labeled dataset — clean boxes,
            honeypot-verified, 5% human spot-checked. Higher label quality in,
            higher model accuracy out.
          </p>
          <div className="mt-6 rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Validation mAP@50 over training</span>
              <span className="font-medium text-accent-ink">→ 98.8%</span>
            </div>
            <TrainingCurve />
            <div className="flex justify-between text-xs text-faint">
              <span>epoch 1</span>
              <span>epoch 120</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {METRICS.map((m, i) => (
            <Reveal
              key={m.label}
              delay={i * 90}
              className="rounded-xl border border-line bg-canvas p-5"
            >
              <span
                className="inline-block h-1.5 w-8 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <p className="mt-3 text-sm text-muted">{m.label}</p>
              <p
                className="display mt-1 text-4xl font-semibold tracking-tighter2"
                style={{ color: m.color }}
              >
                <Counter value={m.value} decimals={1} suffix="%" />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
