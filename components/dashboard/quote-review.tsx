"use client";

// Shared quote-review desk used by BOTH the admin and reviewer dashboards.
// `apiBase` is "/admin" or "/reviewer" — the endpoints are identical under each.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileVideo,
  ImageIcon,
  Loader2,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/form";
import { EmptyState } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

const RATES: Record<string, number> = {
  classification: 1.5,
  bbox: 5,
  keypoint: 8,
  polygon: 12,
  segmentation: 18,
};

export interface PendingQuote {
  project_id: string;
  project_name: string;
  client_company: string | null;
  annotation_type: string;
  image_count: number;
  video_count: number;
  total_files: number;
  complexity_tier: string | null;
  estimated_objects_per_image: number | null;
  turnaround_days: number | null;
  delivery_format: string;
  suggested: {
    rate_per_label_inr: number;
    estimated_labels: number;
    quoted_total_inr: number;
  } | null;
}

export function QuoteReviewDesk({ apiBase }: { apiBase: "/admin" | "/reviewer" }) {
  const [pending, setPending] = useState<PendingQuote[] | null>(null);

  const refresh = useCallback(() => {
    api<PendingQuote[]>(`${apiBase}/quotes/pending`)
      .then(setPending)
      .catch(() => setPending([]));
  }, [apiBase]);

  useEffect(() => refresh(), [refresh]);

  if (pending === null) {
    return (
      <div className="h-32 rounded-lg border border-line bg-surface p-5">
        <div className="skeleton h-5 w-1/3 rounded" />
      </div>
    );
  }
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={<Wallet size={28} />}
        title="No quotes waiting"
        description="When a client's dataset finishes counting, its draft quote appears here for review."
      />
    );
  }
  return (
    <div className="space-y-5">
      {pending.map((q) => (
        <QuoteReviewCard
          key={q.project_id}
          q={q}
          apiBase={apiBase}
          onPublished={refresh}
        />
      ))}
    </div>
  );
}

function QuoteReviewCard({
  q,
  apiBase,
  onPublished,
}: {
  q: PendingQuote;
  apiBase: string;
  onPublished: () => void;
}) {
  const [objects, setObjects] = useState(
    q.estimated_objects_per_image?.toString() ?? "1",
  );
  const [rate, setRate] = useState(
    (q.suggested?.rate_per_label_inr ?? RATES[q.annotation_type] ?? 5).toString(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const avg = parseFloat(objects) || 0;
    const r = parseFloat(rate) || 0;
    const labels = Math.max(1, Math.round(q.total_files * avg));
    return { labels, total: Math.round(labels * r) };
  }, [objects, rate, q.total_files]);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      await api(`${apiBase}/projects/${q.project_id}/quote/publish`, {
        method: "POST",
        body: JSON.stringify({
          avg_objects_per_image: parseFloat(objects) || null,
          rate_per_label_inr: parseFloat(rate) || null,
        }),
      });
      onPublished();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tightish">{q.project_name}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {q.client_company ?? "Client"} · {TYPE_LABEL[q.annotation_type]} ·{" "}
            {q.turnaround_days ?? 14}-day turnaround
          </p>
        </div>
        {q.complexity_tier && (
          <Badge tone="warning" className="capitalize">
            <Sparkles size={12} /> {q.complexity_tier}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon size={15} /> {formatNumber(q.image_count)} images
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileVideo size={15} /> {formatNumber(q.video_count)} videos
        </span>
        <span>
          Auto-estimate: ~{q.estimated_objects_per_image ?? "?"} objects/image
          {q.suggested && <> → {formatINR(q.suggested.quoted_total_inr)}</>}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field
          label="Objects per image"
          hint="Correct this after eyeballing the data — dense scenes can hold 60+."
        >
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={objects}
            onChange={(e) => setObjects(e.target.value)}
          />
        </Field>
        <Field label="Rate per label (₹)">
          <Input
            type="number"
            min="0.5"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <div className="pb-1">
          <p className="text-xs text-faint">
            ≈ {formatNumber(preview.labels)} labels
          </p>
          <p className="text-2xl font-semibold tracking-tighter2">
            {formatINR(preview.total)}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button onClick={publish} disabled={busy}>
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Publish quote to client
        </Button>
      </div>
    </Card>
  );
}
