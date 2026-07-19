"use client";

import { Boxes } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";

export default function ModelsPage() {
  return (
    <SectionPlaceholder
      title="Models"
      description="Detection models trained on your labeled datasets, with accuracy metrics."
      icon={<Boxes size={28} />}
      emptyTitle="No models yet"
      emptyBody="Label a dataset in one of your projects, then train a model on it. Trained models will appear here with mAP, precision and recall."
    />
  );
}
