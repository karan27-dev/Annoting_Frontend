"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Settings2, Rocket } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { Project } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Bounding box",
  polygon: "Polygon",
  segmentation: "Segmentation",
  keypoint: "Keypoint",
  classification: "Classification",
};

const FORMAT_LABEL: Record<string, string> = {
  coco: "COCO JSON",
  yolo: "YOLO TXT",
  voc: "Pascal VOC XML",
  cvat_xml: "CVAT XML",
  datumaro: "Datumaro JSON",
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api<Project[]>("/admin/projects")
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  return (
    <>
      <PageHeader
        title="All projects"
        description="Set up CVAT, launch routing and trigger delivery."
      />

      {projects === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects yet"
          description="When clients create projects, they appear here for CVAT setup and launch."
        />
      ) : (
        <DataTable
          columns={["Project", "Type", "Data", "Intake", "Progress", "Status", ""]}
        >
          {projects.map((p) => {
            const pct = p.total_images
              ? Math.round((p.images_completed / p.total_images) * 100)
              : 0;
            const files =
              p.image_count || p.video_count
                ? [
                    p.image_count ? `${formatNumber(p.image_count)} img` : null,
                    p.video_count ? `${formatNumber(p.video_count)} vid` : null,
                  ]
                    .filter(Boolean)
                    .join(" + ")
                : formatNumber(p.total_images);
            return (
              <tr key={p.id} className="hover:bg-canvas/60">
                <td className="px-4 py-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-faint">
                    {p.data_source === "gdrive" ? "Google Drive" : "Upload"} ·
                    delivers {FORMAT_LABEL[p.delivery_format] ?? "COCO"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {TYPE_LABEL[p.annotation_type]}
                </td>
                <td className="px-4 py-3 text-muted">{files}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.intake_status} />
                </td>
                <td className="px-4 py-3">{pct}%</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "pending_setup" ? (
                    <Link href={`/admin/projects/${p.id}/setup`}>
                      <Button
                        size="sm"
                        variant={
                          p.intake_status === "quote_accepted"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        <Settings2 size={14} /> Set up
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="ghost">
                      <Rocket size={14} /> Manage
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
