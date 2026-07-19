"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FolderKanban,
  Boxes,
  Lock,
  PenTool,
  Users,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import type { Project } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  bbox: "Object Detection",
  polygon: "Instance Segmentation",
  segmentation: "Semantic Segmentation",
  keypoint: "Keypoint Detection",
  classification: "Classification",
};

type Sort = "recent" | "name" | "images";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  useEffect(() => {
    api<Project[]>("/projects").then(setProjects).catch(() => setProjects([]));
  }, []);

  const shown = useMemo(() => {
    if (!projects) return [];
    const filtered = projects.filter((p) =>
      p.name.toLowerCase().includes(q.trim().toLowerCase()),
    );
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "images") return b.total_images - a.total_images;
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [projects, q, sort]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tighter2">Projects</h1>
        <LinkButton href="/projects/new" size="sm">
          <Plus size={16} /> New Project
        </LinkButton>
      </div>

      {/* controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects"
            className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent/50"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-10 cursor-pointer rounded-full border border-line bg-surface px-4 text-sm outline-none"
        >
          <option value="recent">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="images">Sort: Images</option>
        </select>
      </div>

      {projects === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-line bg-surface" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <ProjectsEmpty hasAny={projects.length > 0} query={q} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const selfServe = p.mode === "self_serve";
  const href = selfServe ? `/datasets/${p.id}` : `/projects/${p.id}`;
  const edited = new Date(p.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:shadow-soft"
    >
      {/* thumbnail band */}
      <div className="relative flex h-28 items-center justify-center bg-ink">
        <Boxes size={28} className="text-canvas/25" />
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <Lock size={9} /> Private
        </span>
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            selfServe ? "bg-accent text-white" : "bg-canvas text-ink",
          )}
        >
          {selfServe ? <PenTool size={9} /> : <Users size={9} />}
          {selfServe ? "Self-serve" : "Managed"}
        </span>
      </div>
      {/* meta */}
      <div className="p-4">
        <span className="inline-flex items-center gap-1 rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[11px] font-medium text-muted">
          {TYPE_LABEL[p.annotation_type] ?? p.annotation_type}
        </span>
        <h3 className="mt-2 font-semibold tracking-tightish group-hover:text-accent-ink">
          {p.name}
        </h3>
        <p className="mt-0.5 text-xs text-faint">Created {edited}</p>
        <p className="mt-2 text-sm text-muted">
          {formatNumber(p.total_images)} image
          {p.total_images === 1 ? "" : "s"}
          {selfServe
            ? ` · ${formatNumber(p.images_completed)} labeled`
            : ` · ${p.status.replace(/_/g, " ")}`}
        </p>
      </div>
    </Link>
  );
}

function ProjectsEmpty({ hasAny, query }: { hasAny: boolean; query: string }) {
  if (hasAny) {
    return (
      <div className="grid-texture flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <Search size={26} className="text-faint" />
        <p className="mt-3 font-medium">No projects match “{query}”</p>
      </div>
    );
  }
  return (
    <div className="grid-texture flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-20 text-center">
      <FolderKanban size={28} className="text-faint" />
      <p className="mt-4 text-lg font-medium">Create your first project</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        Annotate your own images into a dataset, or send us your data and we
        label it for you.
      </p>
      <LinkButton href="/projects/new" size="sm" className="mt-5">
        <Plus size={16} /> New Project
      </LinkButton>
    </div>
  );
}
