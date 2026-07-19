"use client";

import { Compass } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";

export default function UniversePage() {
  return (
    <SectionPlaceholder
      title="Universe"
      description="Browse public datasets and pretrained models to jump-start your project."
      icon={<Compass size={28} />}
      emptyTitle="Universe is coming soon"
      emptyBody="A library of open datasets and models you can fork into your workspace. For now, start from your own images in Projects."
    />
  );
}
