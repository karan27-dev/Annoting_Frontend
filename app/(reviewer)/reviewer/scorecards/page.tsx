"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable, EmptyState } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface Scorecard {
  annotator_id: string;
  name: string;
  rolling_accuracy: number;
  rework_rate: number;
  jobs_completed: number;
  trend: "up" | "down" | "flat";
}

export default function ScorecardsPage() {
  const [rows, setRows] = useState<Scorecard[] | null>(null);

  useEffect(() => {
    api<Scorecard[]>("/reviewer/annotator-scorecards")
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Annotator scorecards"
        description="Accuracy, rework rate and trend across active annotators."
      />

      {rows === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="No scorecards yet"
          description="Once annotators complete jobs, their accuracy and rework trends appear here."
        />
      ) : (
        <DataTable columns={["Annotator", "Accuracy", "Rework rate", "Jobs", "Trend"]}>
          {rows.map((r) => (
            <tr key={r.annotator_id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3">
                <Badge tone={r.rolling_accuracy >= 0.85 ? "success" : "warning"}>
                  {(r.rolling_accuracy * 100).toFixed(0)}%
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted">
                {(r.rework_rate * 100).toFixed(0)}%
              </td>
              <td className="px-4 py-3 text-muted">{formatNumber(r.jobs_completed)}</td>
              <td className="px-4 py-3">
                {r.trend === "up" ? (
                  <TrendingUp size={16} className="text-success" />
                ) : r.trend === "down" ? (
                  <TrendingDown size={16} className="text-danger" />
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
