"use client";

import { PageHeader } from "@/components/dashboard/shell";
import { QuoteReviewDesk } from "@/components/dashboard/quote-review";

export default function AdminQuotes() {
  return (
    <>
      <PageHeader
        title="Quote review"
        description="Counted datasets waiting for a human-reviewed price. Check the density, set the numbers, publish to the client."
      />
      <QuoteReviewDesk apiBase="/admin" />
    </>
  );
}
