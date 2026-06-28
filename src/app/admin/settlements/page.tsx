'use client';

import React, { useState, useEffect } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import { 
  Calendar, 
  Banknote, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  XCircle,
  Loader2,
  DollarSign
} from 'lucide-react';

export default function AdminSettlementsPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BATCHES' | 'LEDGER' | 'BANKS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);

  // Data States
  const [overview, setOverview] = useState<any>({});
  const [batches, setBatches] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  async function fetchData(tab: string) {
    setLoading(true);
    try {
      if (tab === 'OVERVIEW') {
        const { data: bData } = await supabase.from('settlement_batches').select('status, commission_amount, net_amount');
        let pending = 0; let ready = 0; let paid = 0; let totalComm = 0; let totalEarn = 0;
        bData?.forEach(b => {
          totalComm += Number(b.commission_amount || 0);
          totalEarn += Number(b.net_amount || 0);
          if (b.status === 'PROCESSING') pending++;
          if (b.status === 'READY_FOR_PAYOUT') ready++;
          if (b.status === 'PAID') paid++;
        });
        setOverview({ pending, ready, paid, totalComm, totalEarn });
      } else if (tab === 'BATCHES') {
        const { data } = await supabase.from('settlement_batches').select('*').order('created_at', { ascending: false });
        setBatches(data || []);
      } else if (tab === 'LEDGER') {
        const { data } = await supabase.from('settlement_ledger').select('*, workers(users(full_name, phone))').order('created_at', { ascending: false }).limit(50);
        setLedger(data || []);
      } else if (tab === 'BANKS') {
        const res = await fetch('/api/admin/settlements/bank-accounts');
        const json = await res.json();
        setBanks(json.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkReady(batchId: string) {
    if (!confirm('Mark this batch as READY FOR PAYOUT?')) return;
    try {
      const res = await fetch('/api/admin/settlements/mark-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      if (res.ok) fetchData('BATCHES');
      else alert('Failed to update batch');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVerifyBank(accountId: string, isVerify: boolean) {
    if (!confirm(`Are you sure you want to ${isVerify ? 'verify' : 'reject'} this bank account?`)) return;
    try {
      const res = await fetch('/api/admin/settlements/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, action: isVerify ? 'VERIFY' : 'REJECT' })
      });
      if (res.ok) fetchData('BANKS');
    } catch (err) {
      console.error(err);
    }
  }

  const batchColumns: Column<any>[] = [
    { key: 'batch_reference', header: 'Reference', render: (r) => <span className="font-mono text-xs text-slate-500 font-bold">{r.batch_reference}</span> },
    { key: 'batch_type', header: 'Type', render: (r) => <span className="font-bold text-slate-350 font-mono text-xs uppercase">{r.batch_type}</span> },
    { key: 'total_workers', header: 'Partners Count', render: (r) => <span className="font-bold text-white">{r.total_workers}</span> },
    { key: 'net_amount', header: 'Net Payout', render: (r) => <span className="text-[#22C55E] font-black font-mono">₹{Number(r.net_amount).toLocaleString()}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => (
        r.status === 'PROCESSING' ? (
          <button 
            onClick={() => handleMarkReady(r.id)} 
            className="px-3.5 py-1.5 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow"
          >
            Mark Ready
          </button>
        ) : null
      )
    }
  ];

  const ledgerColumns: Column<any>[] = [
    { key: 'worker', header: 'Technician', render: (r) => <span className="font-bold text-white">{r.workers?.users?.full_name || 'Worker'}</span> },
    { key: 'booking_id', header: 'Booking Reference', render: (r) => <span className="font-mono text-[10px] text-slate-500 font-bold">BK-{r.booking_id.slice(0, 8).toUpperCase()}</span> },
    { key: 'gross_amount', header: 'Gross Billing', render: (r) => <span className="font-mono text-slate-300">₹{r.gross_amount}</span> },
    { key: 'commission_amount', header: 'Platform Fee', render: (r) => <span className="font-mono text-[#EF4444] font-bold">-₹{r.commission_amount}</span> },
    { key: 'net_amount', header: 'Net Payout', render: (r) => <span className="font-mono text-[#22C55E] font-bold">₹{r.net_amount}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
  ];

  const bankColumns: Column<any>[] = [
    { key: 'worker', header: 'Technician', render: (r) => <span className="font-bold text-slate-200">{r.workers?.users?.full_name}</span> },
    { key: 'bank_name', header: 'Bank Name', render: (r) => <span className="font-semibold text-slate-400">{r.bank_name}</span> },
    { key: 'account', header: 'Account No.', render: (r) => <span className="font-mono text-slate-300 font-bold">{r.account_number_decrypted || 'XXXX'+r.account_last_four}</span> },
    { key: 'ifsc_code', header: 'IFSC Code', render: (r) => <span className="font-mono text-slate-400 font-bold">{r.ifsc_code}</span> },
    { key: 'is_verified', header: 'Verification', render: (r) => (
      <span className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-lg border ${r.is_verified ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 animate-pulse'}`}>
        {r.is_verified ? 'VERIFIED' : 'PENDING'}
      </span>
    )},
    { key: 'actions', header: 'Actions', render: (r) => (
      !r.is_verified && (
        <div className="flex gap-2">
          <button onClick={() => handleVerifyBank(r.id, true)} className="text-[#22C55E] hover:text-[#22C55E]/80 transition-all cursor-pointer"><CheckCircle className="h-5 w-5" /></button>
          <button onClick={() => handleVerifyBank(r.id, false)} className="text-[#EF4444] hover:text-[#EF4444]/80 transition-all cursor-pointer"><XCircle className="h-5 w-5" /></button>
        </div>
      )
    )}
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">Platform Settlements</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Review weekly payouts, verify technician bank credentials, and process transfers.</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2.5 overflow-x-auto border-b border-[#1F2937] pb-3 no-print scrollbar-hide">
        {['OVERVIEW', 'BATCHES', 'LEDGER', 'BANKS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-[#FF8A00] text-white shadow-lg shadow-orange-950/20' 
                : 'bg-[#111827] text-slate-400 hover:bg-[#172033] hover:text-white border border-[#1F2937]'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Synchronizing Ledger Logs...</span>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">Pending Payout Batches</span>
                  <p className="text-3xl font-black text-white">{overview.pending || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-[#FF8A00] flex items-center justify-center border border-orange-500/20 shadow">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">Ready For Payout</span>
                  <p className="text-3xl font-black text-[#22C55E]">{overview.ready || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20 shadow">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">Commission Collected</span>
                  <p className="text-3xl font-black text-white font-mono">₹{overview.totalComm?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/20 shadow">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BATCHES' && (
            <DataTable columns={batchColumns} data={batches} emptyMessage="No batches found." />
          )}

          {activeTab === 'LEDGER' && (
            <DataTable columns={ledgerColumns} data={ledger} emptyMessage="No ledger entries found." />
          )}

          {activeTab === 'BANKS' && (
            <DataTable columns={bankColumns} data={banks} emptyMessage="No bank accounts registered." />
          )}
        </div>
      )}
    </div>
  );
}
