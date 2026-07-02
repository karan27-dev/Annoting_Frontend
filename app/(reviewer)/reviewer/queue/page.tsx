"use client";

import { useEffect, useState } from "react";
import { ListChecks, RotateCcw, X, Clock, Eye } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QualityBadge, EmptyState } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QueueItem {
  assignment_id: string;
  annotator_name: string;
  task_type: string;
  iou_score: number;
  reason: string;
  age_hours: number;
  cvat_job_url?: string;
}

const FILTERS = [
  "All",
  "Auto-rejected",
  "Consensus dispute",
  "Client revision",
  "Random spot-check",
] as const;

export default function ReviewerQueue() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    api<QueueItem[]>("/reviewer/queue")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  async function act(
    id: string,
    action: "approve" | "revise" | "reject",
  ) {
    try {
      await api(`/reviewer/queue/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ notes: "" }),
      });
      setItems((prev) => prev?.filter((i) => i.assignment_id !== id) ?? null);
    } catch {
      /* keep item on error */
    }
  }

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Adjudicate flagged jobs — approve, request revision or reject."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              filter === f
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-line bg-surface text-muted hover:border-accent/40",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={28} />}
          title="Queue is clear"
          description="No jobs are waiting for review. Flagged jobs, consensus disputes and spot-checks will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.assignment_id}
              className="flex flex-wrap items-center justify-between gap-4 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="font-medium">{item.annotator_name}</p>
                  <p className="text-sm text-muted">
                    {item.task_type} · #{item.assignment_id.slice(0, 8)}
                  </p>
                </div>
                <QualityBadge iou={item.iou_score} />
                <Badge tone="warning">{item.reason}</Badge>
                <Badge tone="neutral">
                  <Clock size={12} /> {item.age_hours}h in queue
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(item.assignment_id, "revise")}
                >
                  <RotateCcw size={14} /> Revise
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(item.assignment_id, "reject")}
                >
                  <X size={14} /> Reject
                </Button>
                <LinkButton size="sm" href={`/reviewer/queue/${item.assignment_id}`}>
                  <Eye size={14} /> Review
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
