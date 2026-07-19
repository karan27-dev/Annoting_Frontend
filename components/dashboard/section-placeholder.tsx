import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { EmptyState } from "@/components/dashboard/widgets";

// Honest "not built yet" section — shows what the feature will do and points
// back to the real flow. No fake data.
export function SectionPlaceholder({
  title,
  description,
  icon,
  emptyTitle,
  emptyBody,
  ctaHref = "/dashboard",
  ctaLabel = "Go to Projects",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  emptyTitle: string;
  emptyBody: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyBody}
        action={
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink/90"
          >
            {ctaLabel} <ArrowRight size={15} />
          </Link>
        }
      />
    </>
  );
}
