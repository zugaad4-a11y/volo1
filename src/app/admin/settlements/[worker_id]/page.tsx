'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import ExportCsvButton from '@/components/admin/shared/ExportCsvButton';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { ArrowLeft, User, Phone, Banknote, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentDetail {
  booking_id: string;
  amount: number;
}

interface SettlementDetail {
  id: string;
  worker_id: string;
  amount: number;
  status: string;
  week_end_date: string;
  payout_initiated_at: string | null;
  payout_completed_at: string | null;
  razorpayx_payout_id: string | null;
  created_at: string;
  payment?: PaymentDetail[];
}

export default function WorkerSettlementDetailPage() {
  const router = useRouter();
  const { worker_id } = useParams() as { worker_id: string };
  const [workerName, setWorkerName] = useState('Worker Payouts');
  const [workerPhone, setWorkerPhone] = useState('');
  const [history, setHistory] = useState<SettlementDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track which rows are expanded to show payment breakdowns
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/settlements/${worker_id}`);
        if (!res.ok) throw new Error('Failed to fetch worker settlements details');
        const data = await res.json();
        setWorkerName(data.worker_name);
        setWorkerPhone(data.worker_phone);
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (worker_id) {
      fetchDetails();
    }
  }, [worker_id]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </button>
        <LoadingSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/admin/settlements')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors select-none mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Settlements
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white select-none">
            {workerName}&apos;s Settlement History
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/workers/${worker_id}`}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors"
          >
            View Worker Profile
          </Link>
          <ExportCsvButton
            data={history.map((h) => ({
              'Settlement ID': h.id,
              Amount: h.amount,
              Status: h.status,
              'Week End Date': h.week_end_date,
              'Payout Initiated': h.payout_initiated_at || 'N/A',
              'Payout Completed': h.payout_completed_at || 'N/A',
              'Razorpay Payout ID': h.razorpayx_payout_id || 'N/A',
            }))}
            filename={`${workerName.replace(/\s+/g, '_')}_settlements.csv`}
            disabled={history.length === 0}
          />
        </div>
      </div>

      {/* Worker Card details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-600/10 text-rose-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Worker</p>
            <p className="text-sm font-bold text-slate-200">{workerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-l border-slate-800/80 pl-6">
          <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Contact Phone</p>
            <p className="text-sm font-semibold text-slate-300 font-mono">{workerPhone || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-l border-slate-800/80 pl-6">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Payouts</p>
            <p className="text-sm font-bold text-slate-200">
              {history.length} batches
            </p>
          </div>
        </div>
      </div>

      {/* History Ledger List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/20">
          <h2 className="text-sm font-bold text-white">Settlement ledger records</h2>
        </div>

        {history.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm text-slate-350">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="w-10 px-5 py-3"></th>
                  <th className="px-5 py-3">Settlement ID</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Week End Date</th>
                  <th className="px-5 py-3">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => {
                  const isExpanded = !!expandedRows[item.id];
                  const hasPayments = item.payment && item.payment.length > 0;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => hasPayments && toggleRow(item.id)}
                        className={`transition-colors ${
                          hasPayments ? 'cursor-pointer hover:bg-slate-800/30' : ''
                        }`}
                      >
                        <td className="px-5 py-4 text-center">
                          {hasPayments && (
                            <span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          {item.id}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-200 font-mono">
                          ₹{Number(item.amount).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {new Date(item.week_end_date).toLocaleDateString([], { dateStyle: 'medium' })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {item.status === 'PAID' ? (
                            <div className="space-y-0.5 text-xs text-slate-400">
                              <span className="block text-green-400 font-semibold">Completed Payout</span>
                              {item.payout_completed_at && (
                                <span className="block text-[10px] text-slate-500">
                                  {new Date(item.payout_completed_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">
                              {item.payout_initiated_at ? 'Processing Payout...' : 'Awaiting payout run'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Payment breakdowns sub-row */}
                      {isExpanded && hasPayments && (
                        <tr>
                          <td colSpan={6} className="bg-slate-950/40 px-12 py-4 border-y border-slate-800/60">
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Associated Bookings breakdown
                              </h4>
                              <div className="w-full max-w-lg overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
                                <table className="w-full text-xs text-left text-slate-350">
                                  <thead className="bg-slate-950 text-slate-500 border-b border-slate-800 text-[10px] font-bold uppercase">
                                    <tr>
                                      <th className="px-4 py-2">Booking ID</th>
                                      <th className="px-4 py-2 text-right">Earning Share</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40">
                                    {item.payment?.map((pmt) => (
                                      <tr key={pmt.booking_id} className="hover:bg-slate-850/30">
                                        <td className="px-4 py-2 font-mono text-rose-400">
                                          <Link href={`/admin/bookings/${pmt.booking_id}`}>
                                            {pmt.booking_id}
                                          </Link>
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-slate-200 font-mono">
                                          ₹{Number(pmt.amount).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            No settlement histories recorded for this worker.
          </div>
        )}
      </div>
    </div>
  );
}
