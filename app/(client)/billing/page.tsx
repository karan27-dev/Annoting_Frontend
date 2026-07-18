"use client";

import { useEffect, useState } from "react";
import { Receipt, FileText, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    api<Invoice[]>("/billing/invoices")
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  return (
    <>
      <PageHeader title="Billing" description="Your invoices and payment history." />

      {/* Payments coming soon banner */}
      <Card className="mb-6 flex items-center gap-4 border-accent/30 bg-accent-soft/50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
          <Clock size={18} />
        </span>
        <div>
          <p className="font-medium text-accent-ink">
            Online payments are coming soon
          </p>
          <p className="text-sm text-accent-ink/70">
            UPI, cards and net-banking via Razorpay will go live shortly. For now,
            invoices are settled offline — we&apos;ll email you the details.
          </p>
        </div>
      </Card>

      {invoices === null ? (
        <div className="h-40 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/4 rounded" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title="No invoices yet"
          description="Invoices appear here once a project is delivered."
        />
      ) : (
        <DataTable
          columns={["Invoice", "Amount", "GST", "Total", "Status", ""]}
        >
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
              <td className="px-4 py-3">{formatINR(inv.amount_inr)}</td>
              <td className="px-4 py-3 text-muted">{formatINR(inv.gst_amount_inr)}</td>
              <td className="px-4 py-3 font-medium">{formatINR(inv.total_inr)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <LinkButton
                  href={`/billing/invoices/${inv.id}`}
                  variant="ghost"
                  size="sm"
                >
                  <FileText size={15} /> View / PDF
                </LinkButton>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
