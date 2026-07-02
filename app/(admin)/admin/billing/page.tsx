"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable, StatusBadge, EmptyState } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    api<Invoice[]>("/billing/invoices")
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="All client invoices. Online payments via Razorpay coming soon."
      />

      {invoices === null ? (
        <div className="h-32 rounded-lg border border-line bg-surface p-5">
          <div className="skeleton h-5 w-1/3 rounded" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title="No invoices yet"
          description="Generate an invoice when a project is delivered."
        />
      ) : (
        <DataTable columns={["Invoice", "Total", "Status", ""]}>
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-canvas/60">
              <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
              <td className="px-4 py-3 font-medium">{formatINR(inv.total_inr)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" disabled title="Coming soon">
                  Payment link
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
