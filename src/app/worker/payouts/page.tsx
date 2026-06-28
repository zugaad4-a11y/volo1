'use client';

import React from 'react';
import useSWR from 'swr';
import { Landmark, CheckCircle2, Clock, XCircle, RefreshCw, Loader2, IndianRupee } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getPayoutStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'SUCCESS':
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20">Paid</span>;
    case 'PROCESSING':
    case 'IN_TRANSIT':
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 animate-pulse">Processing</span>;
    case 'PENDING':
    case 'INITIATED':
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06]">Pending</span>;
    case 'FAILED':
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-red-500/10 text-[#EF4444] border border-red-500/20">Failed</span>;
    default:
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-[#070B14] text-slate-400 border border-white/[0.04]">{status}</span>;
  }
};

export default function WorkerPayoutsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/worker/payouts', fetcher);

  const report = data?.report || {};
  const payouts = data?.payouts || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#FF7A00]" />
              Bank Transfer History
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Track payout transfers to your registered bank account and review settlement batch records.</p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="p-2.5 bg-[#070B14]/60 border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Syncing bank transfer records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl text-center text-xs text-red-400 font-bold">
          Failed to load payout history.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F172A] border border-emerald-500/20 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                <span className="text-[9px] font-black text-[#22C55E] uppercase tracking-wider">Lifetime Paid</span>
              </div>
              <p className="text-xl font-black text-white">₹{(report.lifetimePaid || 0).toLocaleString()}</p>
            </div>

            <div className="bg-[#0F172A] border border-amber-500/20 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="h-4 w-4 text-[#F59E0B]" />
                <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-wider">Upcoming</span>
              </div>
              <p className="text-xl font-black text-white">₹{(report.upcomingAmount || 0).toLocaleString()}</p>
            </div>

            <div className="bg-[#0F172A] border border-red-500/20 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <XCircle className="h-4 w-4 text-[#EF4444]" />
                <span className="text-[9px] font-black text-[#EF4444] uppercase tracking-wider">Failed</span>
              </div>
              <p className="text-xl font-black text-[#EF4444]">₹{(report.failedAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Payout History */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-white/[0.06] select-none">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transfer History</h3>
            </div>

            {payouts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Landmark className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-400">No Bank Transfers Yet</p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Your first settlement payout will appear here once processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {payouts.map((p: any) => (
                  <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200">
                        {new Date(p.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        Ref: {p.settlement_batches?.batch_reference || p.id.split('-')[0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getPayoutStatusBadge(p.status)}
                      <div className="flex items-center gap-0.5 text-sm font-black text-[#22C55E]">
                        <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                        ₹{(p.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
