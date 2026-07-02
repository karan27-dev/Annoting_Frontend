"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Users, Tags, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Stat, Card } from "@/components/ui/card";
import { MiniBars, EmptyState } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/utils";

interface AdminSummary {
  active_projects: number;
  annotators_online: number;
  labels_today: number;
  revenue_mtd_inr: number;
  pending_setup: number;
}

export default function AdminDashboard() {
  const [s, setS] = useState<AdminSummary | null>(null);

  useEffect(() => {
    api<AdminSummary>("/admin/dashboard")
      .then(setS)
      .catch(() =>
        setS({
          active_projects: 0,
          annotators_online: 0,
          labels_today: 0,
          revenue_mtd_inr: 0,
          pending_setup: 0,
        }),
      );
  }, []);

  return (
    <>
      <PageHeader
        title="Operations overview"
        description="The full pipeline at a glance — projects, people and revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active projects"
          value={s?.active_projects ?? "—"}
          hint={s?.pending_setup ? `${s.pending_setup} pending setup` : undefined}
          icon={<FolderKanban size={18} />}
        />
        <Stat
          label="Annotators online"
          value={s?.annotators_online ?? "—"}
          icon={<Users size={18} />}
        />
        <Stat
          label="Labels today"
          value={formatNumber(s?.labels_today ?? 0)}
          icon={<Tags size={18} />}
        />
        <Stat
          label="Revenue MTD"
          value={formatINR(s?.revenue_mtd_inr ?? 0)}
          icon={<IndianRupee size={18} />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm font-medium">Labels delivered — last 14 days</p>
          <MiniBars
            className="mt-4 h-28"
            data={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
          />
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium">Project health</p>
          <div className="mt-4">
            <EmptyState
              title="No active projects"
              description="Launch a project to see velocity, quality and ETA here."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
