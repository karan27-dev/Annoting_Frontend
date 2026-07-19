"use client";

import { Rocket } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";

export default function DeploymentsPage() {
  return (
    <SectionPlaceholder
      title="Deployments"
      description="Serve your trained models behind an API for live inference."
      icon={<Rocket size={28} />}
      emptyTitle="No deployments yet"
      emptyBody="Once you've trained a model, deploy it here to get a hosted inference endpoint you can call from your app."
    />
  );
}
