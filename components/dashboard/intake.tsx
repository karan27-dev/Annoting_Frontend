"use client";

// Live data-intake experience: the client uploads (or links Drive), then
// watches the system count their files, size up complexity, and produce a
// firm quote they can accept on the spot.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Boxes,
  Check,
  FileVideo,
  ImageIcon,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import type { Intake } from "@/lib/types";

// Polls /projects/{id}/intake while the background inspection runs.
export function useIntake(projectId: string | null, active = true) {
  const [intake, setIntake] = useState<Intake | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api<Intake>(`/projects/${projectId}/intake`);
      setIntake(data);
    } catch {
      /* transient — keep polling */
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !active) return;
    refresh();
    timer.current = setInterval(refresh, 2500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [projectId, active, refresh]);

  // Stop polling once intake settles. Keep polling through the admin's quote
  // review so the client sees the published quote appear live.
  useEffect(() => {
    if (
      intake &&
      intake.intake_status !== "counting" &&
      intake.intake_status !== "pending_review" &&
      timer.current
    ) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [intake]);

  return { intake, refresh };
}

const STAGES = [
  { key: "received", label: "Data received", icon: Boxes },
  { key: "counted", label: "Files counted", icon: ScanSearch },
  { key: "review", label: "Priced by our team", icon: ShieldCheck },
  { key: "quoted", label: "Quote ready", icon: Wallet },
  { key: "accepted", label: "Accepted", icon: BadgeCheck },
] as const;

function stageIndex(intake: Intake): number {
  switch (intake.intake_status) {
    case "counting":
      return 0;
    case "counted":
      return 1;
    case "pending_review":
      return 2;
    case "quoted":
      return 3;
    case "quote_accepted":
      return 4;
    default:
      return -1;
  }
}

export function IntakePipeline({ intake }: { intake: Intake }) {
  const idx = stageIndex(intake);
  const counting = intake.intake_status === "counting";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {STAGES.map((s, i) => {
        const done = i < idx || idx === STAGES.length - 1;
        const current = i === idx && !done;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                done && "border-success bg-success text-white",
                current && "border-accent bg-accent-soft text-accent-ink",
                !done && !current && "border-line bg-canvas text-faint",
              )}
            >
              {done ? (
                <Check size={14} />
              ) : current && counting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <s.icon size={14} />
              )}
            </div>
            <span
              className={cn(
                "hidden whitespace-nowrap text-xs sm:inline",
                done && "text-success",
                current && "font-medium text-ink",
                !done && !current && "text-faint",
              )}
            >
              {s.label}
            </span>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors duration-500",
                  i < idx ? "bg-success" : "bg-line",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DetectedCounts({ intake }: { intake: Intake }) {
  const counting = intake.intake_status === "counting";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <CountTile
        icon={<ImageIcon size={16} />}
        label="Images"
        value={counting ? null : intake.image_count}
      />
      <CountTile
        icon={<FileVideo size={16} />}
        label="Videos"
        value={counting ? null : intake.video_count}
      />
      <CountTile
        icon={<Boxes size={16} />}
        label="Objects / image"
        value={
          counting
            ? null
            : intake.estimated_objects_per_image != null
              ? `~${intake.estimated_objects_per_image}`
              : "—"
        }
      />
      <CountTile
        icon={<Sparkles size={16} />}
        label="Complexity"
        value={counting ? null : (intake.complexity_tier ?? "—")}
        capitalize
      />
    </div>
  );
}

function CountTile({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode | null;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-faint">
        {icon}
        {label}
      </div>
      {value === null ? (
        <div className="skeleton mt-2 h-6 w-14 rounded" />
      ) : (
        <p
          className={cn(
            "mt-1.5 text-xl font-semibold tracking-tighter2",
            capitalize && "capitalize",
          )}
        >
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      )}
    </div>
  );
}

export function QuoteCard({
  projectId,
  intake,
  onAccepted,
}: {
  projectId: string;
  intake: Intake;
  onAccepted?: () => void;
}) {
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quote = intake.quote;
  if (!quote) return null;

  const accepted = Boolean(quote.accepted_at);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      await api(`/projects/${projectId}/quote/accept`, { method: "POST" });
      onAccepted?.();
    } catch {
      setError("Could not accept the quote — please retry.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-muted">
            {accepted ? "Accepted quote" : "Your firm quote"}
          </p>
          <p className="display mt-1 text-4xl font-semibold">
            {formatINR(quote.quoted_total_inr)}
          </p>
          <p className="mt-1.5 text-sm text-faint">
            {formatNumber(quote.estimated_labels)} labels ·{" "}
            {formatINR(quote.rate_per_label_inr)}/label
            {quote.turnaround_premium_pct > 0 &&
              ` · +${quote.turnaround_premium_pct}% rush`}
            {quote.volume_discount_pct > 0 &&
              ` · −${quote.volume_discount_pct}% volume`}
          </p>
        </div>
        {accepted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-4 py-2 text-sm font-medium text-success">
            <BadgeCheck size={16} /> Accepted — work begins
          </span>
        ) : (
          <Button onClick={accept} disabled={accepting}>
            {accepting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Accept & start annotation
          </Button>
        )}
      </div>
      {error && <p className="px-6 pb-4 text-sm text-danger">{error}</p>}
      {!accepted && (
        <div className="border-t border-line bg-canvas px-6 py-3 text-xs text-faint">
          Reviewed and priced by our team from your actual data. You&apos;re
          only invoiced for labels that pass review.
        </div>
      )}
    </Card>
  );
}
