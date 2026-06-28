'use client';

import React from 'react';
import useSWR from 'swr';
import { 
  CreditCard, Loader2, AlertCircle, Clock, 
  CheckCircle2, AlertTriangle, ArrowUpRight 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface InvoiceItem {
  id: string;
  invoice_no: string;
  amount: number;
  status: 'GENERATED' | 'PAID' | 'PENDING';
  created_at: string;
  bookings: {
    service_items: {
      name: string;
    };
    created_at: string;
  };
}

export default function CustomerInvoicesPage() {
  const { data, error, isLoading } = useSWR('/api/customer/invoices', fetcher);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Paid</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
      default:
        return <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded bg-slate-50 text-slate-600 border border-slate-200">Generated</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Title Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden select-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-rose-500/5 blur-3xl rounded-full" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Invoices</h2>
        <p className="text-xs text-slate-500">Access and track receipt bills generated upon service completions.</p>
      </div>

      {/* Main Ledger List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-7 w-7 text-rose-600 animate-spin mx-auto mb-2.5" />
          <p className="text-xs">Fetching invoices list...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center text-xs text-red-500">
          Failed to load invoices records.
        </div>
      ) : !data.invoices || data.invoices.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center select-none space-y-2.5">
          <CreditCard className="h-8 w-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-400 text-sm">No Invoices Yet</h4>
          <p className="text-xs text-slate-550 max-w-xs mx-auto">Invoices are automatically compiled and issued here upon technician completions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.invoices.map((invoice: InvoiceItem) => (
            <div
              key={invoice.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-rose-600 block uppercase tracking-wider">
                    {invoice.invoice_no}
                  </span>
                  <h3 className="font-bold text-xs text-slate-800 leading-snug">
                    {invoice.bookings?.service_items?.name || 'Service Completed'}
                  </h3>
                  <span className="text-[8px] text-slate-400 font-mono block select-none">
                    Issued: {new Date(invoice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="text-right space-y-1.5 shrink-0 select-none">
                  <span className="text-xs font-black text-slate-850 block">
                    {formatCurrency(Number(invoice.amount))}
                  </span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
