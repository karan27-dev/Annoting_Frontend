import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function QualityBadge({ iou }: { iou: number }) {
  const tone = iou >= 0.85 ? "success" : iou >= 0.7 ? "warning" : "danger";
  return (
    <Badge tone={tone}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
        )}
      />
      IoU {iou.toFixed(2)}
    </Badge>
  );
}

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending_setup: "warning",
  active: "accent",
  paused: "neutral",
  review: "warning",
  delivered: "success",
  archived: "neutral",
  assigned: "neutral",
  in_progress: "accent",
  submitted: "accent",
  review_pending: "warning",
  approved: "success",
  revision_required: "warning",
  rejected: "danger",
  draft: "neutral",
  sent: "accent",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  // intake pipeline
  awaiting_data: "neutral",
  counting: "warning",
  counted: "accent",
  pending_review: "warning",
  quoted: "accent",
  quote_accepted: "success",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = status.replace(/_/g, " ");
  return <Badge tone={tone} className="capitalize">{label}</Badge>;
}

// Lightweight bar sparkline — no chart lib needed.
export function MiniBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className={cn("flex h-12 items-end gap-1", className)}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-accent/70 transition-all"
          style={{ height: `${(d / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid-texture flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
      {icon && <div className="mb-4 text-faint">{icon}</div>}
      <p className="text-lg font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap px-4 py-3 font-medium text-faint"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
