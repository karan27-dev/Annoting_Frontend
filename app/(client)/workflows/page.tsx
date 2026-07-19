"use client";

import { Workflow } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";

export default function WorkflowsPage() {
  return (
    <SectionPlaceholder
      title="Workflows"
      description="Chain models and logic into a pipeline that runs on your images."
      icon={<Workflow size={28} />}
      emptyTitle="No workflows yet"
      emptyBody="Build a labeled dataset first, train a model, then wire it into a workflow to auto-process new images. This is coming next."
    />
  );
}
