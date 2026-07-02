"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface AnnotatorRow {
  id: string;
  full_name: string;
  city?: string;
  status: string;
  rolling_accuracy: number;
  total_jobs_completed: number;
  skills: Record<string, boolean>;
}

export default function AdminAnnotators() {
  const [rows, setRows] = useState<AnnotatorRow[] | null>(null);

  useEffect(() => {
    api<AnnotatorRow[]>("/admin/annotators")
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Annotators"
        description="Skills, accuracy and workload across your annotator pool."
      />

      {rows === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No annotators yet"
          description="Approved annotator applications appear here, with their certifications and performance."
        />
      ) : (
        <DataTable
          columns={["Name", "City", "Skills", "Accuracy", "Jobs", "Status"]}
        >
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-medium">{a.full_name}</td>
              <td className="px-4 py-3 text-muted">{a.city ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(a.skills ?? {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <Badge key={k} tone="neutral">
                        {k}
                      </Badge>
                    ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={a.rolling_accuracy >= 0.85 ? "success" : "warning"}>
                  {(a.rolling_accuracy * 100).toFixed(0)}%
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted">
                {formatNumber(a.total_jobs_completed)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
