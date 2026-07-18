"use client";

// Printable invoice. The client opens this from Billing and prints to PDF —
// no server-side PDF generator needed, and it always works.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Invoice, Project } from "@/lib/types";

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    api<Invoice[]>("/billing/invoices")
      .then((list) => {
        const inv = list.find((i) => i.id === id) ?? null;
        setInvoice(inv);
        if (inv) {
          api<Project>(`/projects/${inv.project_id}`)
            .then(setProject)
            .catch(() => setProject(null));
        }
      })
      .catch(() => setInvoice(null));
  }, [id]);

  if (!invoice) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="mx-auto max-w-3xl">
      {/* screen-only controls */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to billing
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={15} /> Print / Save as PDF
        </Button>
      </div>

      {/* the invoice sheet */}
      <div className="rounded-lg border border-line bg-white p-8 sm:p-10 print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tighter2">Annoting</p>
            <p className="mt-0.5 text-sm text-faint">
              Labeled data, quality guaranteed
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-faint">Invoice</p>
            <p className="mt-1 font-mono text-sm">{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-faint">Project</p>
            <p className="mt-1 font-medium">{project?.name ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-faint">Issued</p>
            <p className="mt-1">{fmtDate(invoice.issued_at)}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-faint">Due</p>
            <p className="mt-1">{fmtDate(invoice.due_at)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-faint">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-3">
                Annotation services
                {project ? ` — ${project.name}` : ""}
              </td>
              <td className="py-3 text-right">{formatINR(invoice.amount_inr)}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-3 text-muted">GST (18%)</td>
              <td className="py-3 text-right text-muted">
                {formatINR(invoice.gst_amount_inr)}
              </td>
            </tr>
            <tr>
              <td className="py-3 font-semibold">Total due</td>
              <td className="py-3 text-right text-lg font-semibold">
                {formatINR(invoice.total_inr)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-8 text-xs text-faint">
          Payable within 15 days. Online payments (UPI, cards, net-banking) are
          coming soon — until then we&apos;ll email you settlement details.
        </p>
      </div>
    </div>
  );
}
