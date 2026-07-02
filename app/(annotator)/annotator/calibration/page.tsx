"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const SKILL_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

interface Profile {
  skills: Record<string, boolean>;
  status: string;
  calibration_passed_at: string | null;
  calibration_score: number | null;
}

export default function CalibrationPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api<Profile>("/annotator/profile").then(setProfile).catch(() => setProfile(null));
  }, []);

  async function start() {
    setStarting(true);
    try {
      const res = await api<{ deep_link: string | null }>(
        "/annotator/calibration/start",
        { method: "POST" },
      );
      if (res.deep_link) window.open(res.deep_link, "_blank");
    } finally {
      setStarting(false);
    }
  }

  const passed = Boolean(profile?.calibration_passed_at);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Calibration"
        description="Pass a short test to get certified and unlock paid jobs."
      />

      <Card className="p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <GraduationCap size={22} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tightish">
                Calibration test
              </h3>
              {passed ? (
                <Badge tone="success">
                  <CheckCircle2 size={13} /> Passed
                </Badge>
              ) : (
                <Badge tone="warning">Not yet taken</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              Label 20 gold-standard images in the canvas. We score your work
              against the answer key — score ≥ 0.75 IoU to pass.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["20", "gold images"],
            ["0.75", "IoU to pass"],
            [
              profile?.calibration_score != null
                ? profile.calibration_score.toFixed(2)
                : "—",
              "your score",
            ],
          ].map(([v, l]) => (
            <div
              key={l}
              className="rounded-xl border border-line bg-canvas p-4 text-center"
            >
              <p className="text-2xl font-semibold tracking-tighter2">{v}</p>
              <p className="text-xs text-faint">{l}</p>
            </div>
          ))}
        </div>

        <Button className="mt-6 w-full" onClick={start} disabled={starting}>
          {starting
            ? "Preparing…"
            : passed
              ? "Re-take calibration"
              : "Start calibration in canvas"}
          {!starting && <ExternalLink size={16} />}
        </Button>
      </Card>

      <Card className="mt-6 p-7">
        <p className="text-sm font-medium">Your certifications</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile === null ? (
            <span className="text-sm text-faint">Loading…</span>
          ) : (
            Object.keys(SKILL_LABEL).map((key) => {
              const on = profile.skills?.[key];
              return (
                <Badge key={key} tone={on ? "success" : "neutral"}>
                  {on ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  {SKILL_LABEL[key]}
                </Badge>
              );
            })
          )}
        </div>
        <p className="mt-4 text-xs text-faint">
          Certifications are granted automatically for the task types you pass.
        </p>
      </Card>
    </div>
  );
}
