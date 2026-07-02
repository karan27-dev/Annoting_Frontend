"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Tags,
  Wallet,
  Plus,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Stat } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import {
  ProgressBar,
  QualityBadge,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/utils";
import type { Project } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

export default function ClientDashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api<Project[]>("/projects")
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const active = projects?.filter((p) => p.status === "active").length ?? 0;
  const labels =
    projects?.reduce((s, p) => s + p.images_completed, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Track your annotation projects, quality and delivery."
        action={
          <LinkButton href="/projects/new" size="sm">
            <Plus size={16} /> New project
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total projects"
          value={projects ? projects.length : "—"}
          icon={<FolderKanban size={18} />}
        />
        <Stat label="Active" value={active} icon={<Clock size={18} />} />
        <Stat
          label="Labels delivered"
          value={formatNumber(labels)}
          icon={<Tags size={18} />}
        />
        <Stat
          label="Lifetime spend"
          value={formatINR(0)}
          hint="Payments coming soon"
          icon={<Wallet size={18} />}
        />
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tightish">
        Your projects
      </h2>

      {projects === null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 rounded-lg border border-line bg-surface p-5">
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton mt-4 h-2 w-full rounded" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects yet"
          description="Create your first annotation project — define your labels, upload a dataset and get an instant quote."
          action={
            <LinkButton href="/projects/new" size="sm">
              <Plus size={16} /> Start a project
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => {
            const pct = p.total_images
              ? Math.round((p.images_completed / p.total_images) * 100)
              : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-lg border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tightish group-hover:text-accent-ink">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {TYPE_LABEL[p.annotation_type]} ·{" "}
                      {formatNumber(p.total_images)} images
                    </p>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-faint transition-colors group-hover:text-accent"
                  />
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.quality_score ? <QualityBadge iou={p.quality_score} /> : null}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-muted">Progress</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                  <p className="mt-1.5 text-xs text-faint">
                    {formatNumber(p.images_completed)} /{" "}
                    {formatNumber(p.total_images)} images labeled
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
