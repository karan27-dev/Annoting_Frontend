"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

interface Invoiceable {
  project_id: string;
  project_name: string;
  client_company: string | null;
  status: string;
  quoted_total_inr: number;
  estimated_labels: number;
  rate_per_label_inr: number;
}

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [ready, setReady] = useState<Invoiceable[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<Invoice[]>("/billing/invoices")
      .then(setInvoices)
      .catch(() => setInvoices([]));
    api<Invoiceable[]>("/billing/invoiceable")
      .then(setReady)
      .catch(() => setReady([]));
  }, []);

  useEffect(() => refresh(), [refresh]);

  async function generate(projectId: string) {
    setBusy(projectId);
    setError(null);
    try {
      await api("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId }),
      });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate invoice");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Generate invoices from accepted quotes and track payment. Online payments via Razorpay coming soon."
      />

      {/* Ready to invoice */}
      {ready && ready.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-sm font-semibold tracking-tightish">
            Ready to invoice
          </h2>
          <p className="mt-1 text-sm text-muted">
            These clients accepted their quote — generate the invoice to bill them.
          </p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-4 space-y-3">
            {ready.map((p) => (
              <div
                key={p.project_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4"
              >
                <div>
                  <p className="font-medium">{p.project_name}</p>
                  <p className="mt-0.5 text-sm text-faint">
                    {p.client_company ?? "Client"} ·{" "}
                    {formatNumber(p.estimated_labels)} labels ·{" "}
                    {formatINR(p.rate_per_label_inr)}/label
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold tracking-tighter2">
                    {formatINR(p.quoted_total_inr)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => generate(p.project_id)}
                    disabled={busy === p.project_id}
                  >
                    {busy === p.project_id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <FileText size={15} />
                    )}
                    Generate invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {invoices === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title="No invoices yet"
          description="Accepted quotes appear above, ready to invoice."
        />
      ) : (
        <DataTable columns={["Invoice", "Amount", "GST", "Total", "Status"]}>
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
              <td className="px-4 py-3">{formatINR(inv.amount_inr)}</td>
              <td className="px-4 py-3 text-muted">
                {formatINR(inv.gst_amount_inr)}
              </td>
              <td className="px-4 py-3 font-medium">{formatINR(inv.total_inr)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={inv.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
