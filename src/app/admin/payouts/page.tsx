'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import { Banknote, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [overview, setOverview] = useState({ total: 0, pending: 0, processing: 0, paid: 0, failed: 0 });

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('payouts')
        .select('*, workers(users(full_name)), settlement_batches(batch_reference)')
        .order('created_at', { ascending: false });

      if (data) {
        setPayouts(data);
        const ov = { total: 0, pending: 0, processing: 0, paid: 0, failed: 0 };
        data.forEach(p => {
          ov.total += Number(p.amount);
          if (['PENDING', 'READY_FOR_PAYOUT'].includes(p.status)) ov.pending += Number(p.amount);
          if (['QUEUED', 'PROCESSING'].includes(p.status)) ov.processing += Number(p.amount);
          if (p.status === 'PAID') ov.paid += Number(p.amount);
          if (p.status === 'FAILED') ov.failed += Number(p.amount);
        });
        setOverview(ov);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<any>[] = [
    { key: 'id', header: 'Payout ID', render: r => <span className="font-mono text-[10px] text-slate-500">{r.id.split('-')[0]}</span> },
    { key: 'worker', header: 'Worker', render: r => <span className="font-semibold">{r.workers?.users?.full_name || 'Worker'}</span> },
    { key: 'amount', header: 'Amount', render: r => <span className="font-mono font-bold text-white">₹{r.amount}</span> },
    { key: 'batch', header: 'Batch Ref', render: r => <span className="font-mono text-xs">{r.settlement_batches?.batch_reference || 'N/A'}</span> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Created', render: r => <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span> },
    { key: 'actions', header: 'Action', render: r => (
      <button onClick={() => router.push(`/admin/payouts/${r.id}`)} className="text-rose-400 hover:text-rose-300">
        <ArrowUpRight className="h-5 w-5" />
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white select-none">Enterprise Payouts</h1>
        <p className="text-xs text-slate-400 select-none">Manage individual provider payouts and track RazorpayX execution states.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Volume</p>
          <p className="text-xl font-bold text-white mt-1">₹{overview.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ready / Pending</p>
          <p className="text-xl font-bold text-white mt-1">₹{overview.pending}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Processing</p>
          <p className="text-xl font-bold text-white mt-1">₹{overview.processing}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Paid Success</p>
          <p className="text-xl font-bold text-white mt-1">₹{overview.paid}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">Failed / Reversed</p>
          <p className="text-xl font-bold text-white mt-1">₹{overview.failed}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <DataTable columns={columns} data={payouts} emptyMessage="No payouts generated yet." />
      </div>
    </div>
  );
}
