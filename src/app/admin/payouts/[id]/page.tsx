'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import { ArrowLeft, History, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminPayoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const payoutId = params.id as string;
  
  const [payout, setPayout] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: p } = await supabase
          .from('payouts')
          .select('*, workers(users(full_name, phone)), settlement_batches(batch_reference)')
          .eq('id', payoutId)
          .single();
        setPayout(p);

        const { data: a } = await supabase
          .from('payout_attempts')
          .select('*')
          .eq('payout_id', payoutId)
          .order('attempt_number', { ascending: false });
        setAttempts(a || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [payoutId]);

  if (loading) return <div className="text-white p-6">Loading details...</div>;
  if (!payout) return <div className="text-white p-6">Payout not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Payouts
      </button>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none">Payout Details</h1>
          <p className="text-xs text-slate-400 font-mono select-all">ID: {payout.id}</p>
        </div>
        <StatusBadge status={payout.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><FileText className="h-4 w-4" /> Transfer Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">Worker</span>
              <span className="text-xs font-semibold text-white">{payout.workers?.users?.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">Amount</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">₹{payout.amount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">Batch Reference</span>
              <span className="text-xs font-semibold text-slate-300">{payout.settlement_batches?.batch_reference || 'Manual Payout'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Created Date</span>
              <span className="text-xs font-semibold text-slate-300">{new Date(payout.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Provider Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">Target Provider</span>
              <span className="text-xs font-semibold text-white">{payout.provider}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">Provider Reference</span>
              <span className="text-xs font-mono text-slate-300">{payout.provider_reference || 'Pending Allocation'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-500">UTR Number</span>
              <span className="text-xs font-mono text-emerald-400">{payout.utr_number || 'Awaiting Bank'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Retry Count</span>
              <span className="text-xs font-bold text-rose-400">{payout.retry_count} / 3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4"><History className="h-4 w-4" /> Execution Attempts</h3>
        {attempts.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">No execution attempts recorded yet. Provider may not be configured.</div>
        ) : (
          <div className="space-y-3">
            {attempts.map(a => (
              <div key={a.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400">Attempt #{a.attempt_number}</span>
                  <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.error_message ? (
                  <div className="flex gap-2 text-rose-400 bg-rose-500/10 p-2 rounded-lg text-xs mt-2 font-mono">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>{a.error_message}</p>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 mt-2">Execution completed. Status: {a.status}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
