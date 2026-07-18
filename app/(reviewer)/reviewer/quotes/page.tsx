"use client";

import { PageHeader } from "@/components/dashboard/shell";
import { QuoteReviewDesk } from "@/components/dashboard/quote-review";

export default function ReviewerQuotes() {
  return (
    <>
      <PageHeader
        title="Quotes"
        description="A client just sent data — review the counted dataset, set the objects-per-image and rate, and publish the quote."
      />
      <QuoteReviewDesk apiBase="/reviewer" />
    </>
  );
}
