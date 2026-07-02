"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sliders,
  PenTool,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";

export default function CvatSetupWizard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [segment, setSegment] = useState(100);
  const [gtPct, setGtPct] = useState(10);
  const [honeypot, setHoneypot] = useState(true);
  const [rate, setRate] = useState(5);
  const [busy, setBusy] = useState(false);

  const steps = [
    { n: 1, label: "Verify upload", icon: CheckCircle2 },
    { n: 2, label: "CVAT config", icon: Sliders },
    { n: 3, label: "Annotate GT", icon: PenTool },
    { n: 4, label: "Launch", icon: Rocket },
  ];

  async function launch() {
    setBusy(true);
    try {
      await api(`/admin/projects/${id}/setup-cvat`, {
        method: "POST",
        body: JSON.stringify({
          segment_size: segment,
          gt_frame_count: gtPct,
          honeypot_mode: honeypot,
        }),
      });
      await api(`/admin/projects/${id}/launch`, { method: "POST" });
      router.push("/admin/projects");
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Project setup" description="Wire this project into CVAT and launch routing." />

      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                step > s.n && "bg-accent text-white",
                step === s.n && "bg-ink text-canvas",
                step < s.n && "bg-line text-faint",
              )}
            >
              {step > s.n ? <Check size={15} /> : <s.icon size={16} />}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                step === s.n ? "font-medium" : "text-faint",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-7">
          <h3 className="font-semibold tracking-tightish">Verify uploaded data</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Files found", "2,000"],
              ["Format", "JPG / PNG"],
              ["Corrupt", "0"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-canvas p-4 text-center">
                <p className="text-2xl font-semibold tracking-tighter2">{v}</p>
                <p className="text-xs text-faint">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)}>
              Looks good <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-6 p-7">
          <h3 className="font-semibold tracking-tightish">CVAT configuration</h3>
          <Field label={`Segment size — ${segment} images per job`}>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={segment}
              onChange={(e) => setSegment(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
          </Field>
          <Field label={`Ground-truth frames — ${gtPct}%`}>
            <input
              type="range"
              min={5}
              max={20}
              value={gtPct}
              onChange={(e) => setGtPct(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
          </Field>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-canvas p-4">
            <div>
              <p className="text-sm font-medium">Honeypot mode</p>
              <p className="text-xs text-faint">
                Inject random GT frames into every job for silent QA.
              </p>
            </div>
            <input
              type="checkbox"
              checked={honeypot}
              onChange={(e) => setHoneypot(e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[var(--accent)]"
            />
          </label>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-7">
          <h3 className="font-semibold tracking-tightish">Annotate ground truth</h3>
          <p className="mt-1 text-sm text-muted">
            Label the GT frames in CVAT — this becomes the answer key for QA.
          </p>
          <Button variant="secondary" className="mt-5">
            Open GT job in CVAT <ExternalLink size={15} />
          </Button>
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={() => setStep(4)}>
              GT annotated <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-6 p-7">
          <h3 className="font-semibold tracking-tightish">Pricing & launch</h3>
          <Field label="Rate per label (₹)">
            <Input
              type="number"
              value={rate}
              step="0.5"
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </Field>
          <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent-ink">
            At {formatINR(rate)}/label, routing will start assigning jobs to
            certified annotators as soon as you launch.
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={launch} disabled={busy}>
              {busy ? "Launching…" : "Launch project"} <Rocket size={16} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
