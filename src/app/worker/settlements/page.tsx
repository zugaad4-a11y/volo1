'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  CreditCard, Calendar, Loader2, IndianRupee, Clock,
  Landmark, AlertCircle, CheckCircle2
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorkerSettlementsPage() {
  const { data: stlData, mutate: mutateStl } = useSWR('/api/worker/settlements', fetcher);
  const { data: bankData, mutate: mutateBank } = useSWR('/api/worker/bank-accounts', fetcher);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: ''
  });
  const [savingBank, setSavingBank] = useState(false);

  const earnings = stlData?.earnings || {};
  const history = stlData?.history || [];
  const account = bankData?.account || null;

  useEffect(() => {
    if (account && !isEditingBank) {
      setBankForm({
        account_holder_name: account.account_holder_name || '',
        bank_name: account.bank_name || '',
        account_number: account.account_number_decrypted || '',
        ifsc_code: account.ifsc_code || ''
      });
    }
  }, [account, isEditingBank]);

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch('/api/worker/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm)
      });
      if (res.ok) {
        await mutateBank();
        setIsEditingBank(false);
      } else {
        alert('Failed to save bank details. Please verify your entries.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBank(false);
    }
  }

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 shadow-sm shadow-emerald-500/5">Completed</span>;
      case 'PROCESSING':
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 shadow-sm shadow-amber-500/5 animate-pulse">Processing</span>;
      case 'PENDING':
      case 'UNPAID':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-white/[0.04] text-slate-400 border border-white/[0.06]">Pending</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-red-500/10 text-[#EF4444] border border-red-500/20 shadow-sm">Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-[#070B14] text-slate-400 border border-white/[0.04]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#FF7A00]" />
          Settlements Ledger
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Manage bank credentials, monitor pending payouts, and view transaction history.</p>
      </div>

      {/* Desktop Responsive Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Metrics & Bank details (6/12 width) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3.5 select-none">
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4 shadow flex flex-col justify-between min-h-[90px] group hover:border-[#FF7A00]/20 transition-all duration-300">
              <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Pending Balance</span>
              <p className="text-base font-black text-white group-hover:text-[#FF7A00] transition-colors mt-2">₹{(earnings.pending_amount || 0).toLocaleString()}</p>
            </div>

            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4 shadow flex flex-col justify-between min-h-[90px] group hover:border-amber-500/20 transition-all duration-300">
              <span className="text-[9px] text-[#F59E0B] font-black uppercase tracking-wider block">Processing Payout</span>
              <p className="text-base font-black text-white mt-2">₹{(earnings.processing_amount || 0).toLocaleString()}</p>
            </div>

            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4 shadow flex flex-col justify-between min-h-[90px] group hover:border-emerald-500/20 transition-all duration-300">
              <span className="text-[9px] text-[#22C55E] font-black uppercase tracking-wider block">Ready / Disbursed</span>
              <p className="text-base font-black text-white mt-2">₹{((earnings.ready_for_payout_amount || 0) + (earnings.paid_amount || 0)).toLocaleString()}</p>
            </div>

            <div className="bg-[#FF7A00]/5 border border-[#FF7A00]/25 rounded-3xl p-4 shadow flex flex-col justify-between min-h-[90px] group transition-all duration-300">
              <span className="text-[9px] text-[#FF7A00] font-black uppercase tracking-wider block">Lifetime Net Payouts</span>
              <p className="text-base font-black text-[#FF7A00] mt-2">₹{(earnings.net_earnings || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Bank Account Section */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6 select-none">
              <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Landmark className="h-4.5 w-4.5 text-[#FF7A00]" />
                Bank Credentials
              </h2>
              {account && !isEditingBank && (
                <button 
                  type="button"
                  onClick={() => setIsEditingBank(true)} 
                  className="text-[10px] text-[#FF7A00] font-black hover:text-[#FF9E43] uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Edit details
                </button>
              )}
            </div>

            {(!account || isEditingBank) ? (
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-505 uppercase tracking-widest pl-1">Account Holder Name</label>
                    <input 
                      required 
                      value={bankForm.account_holder_name} 
                      onChange={e=>setBankForm({...bankForm, account_holder_name: e.target.value})} 
                      placeholder="e.g. Akhil"
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-505 uppercase tracking-widest pl-1">Bank Institution Name</label>
                    <input 
                      required 
                      value={bankForm.bank_name} 
                      onChange={e=>setBankForm({...bankForm, bank_name: e.target.value})} 
                      placeholder="e.g. HDFC Bank"
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-505 uppercase tracking-widest pl-1">Account Number</label>
                    <input 
                      required 
                      value={bankForm.account_number} 
                      onChange={e=>setBankForm({...bankForm, account_number: e.target.value})} 
                      placeholder="Enter account number"
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-mono font-bold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-505 uppercase tracking-widest pl-1">IFSC Code</label>
                    <input 
                      required 
                      value={bankForm.ifsc_code} 
                      onChange={e=>setBankForm({...bankForm, ifsc_code: e.target.value})} 
                      placeholder="IFSC code"
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-mono uppercase font-bold" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2.5 mt-5 select-none">
                  {account && (
                    <button 
                      type="button" 
                      onClick={() => setIsEditingBank(false)} 
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-450 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    disabled={savingBank} 
                    type="submit" 
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#FF7A00] hover:bg-[#FF9E43] text-white shadow shadow-orange-500/10 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {savingBank ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-[#070B14]/85 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-white/[0.04] shadow-inner">
                <div className="space-y-1 font-semibold">
                  <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Institution: <span className="text-white font-bold">{account.bank_name}</span></p>
                  <p className="text-xs text-slate-305 font-mono mt-1">Number: {account.account_number_decrypted || `XXXXXX${account.account_last_four}`}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">IFSC: {account.ifsc_code} • Holder: {account.account_holder_name}</p>
                </div>
                <div className="mt-4 sm:mt-0 select-none">
                  {account.is_verified ? (
                    <span className="flex items-center gap-1.5 text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider animate-pulse">
                      <Clock className="h-3.5 w-3.5" /> Audit Pending
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: History Log List (6/12 width) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 select-none">Settlement history</h3>
            
            {history.length === 0 ? (
              <div className="text-center text-slate-500 text-xs font-semibold italic py-16 select-none">
                No settlement ledger logs found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
                {history.map((h: any) => (
                  <div 
                    key={h.id} 
                    className="bg-[#070B14]/40 border border-white/[0.04] hover:border-white/[0.12] rounded-2xl p-4 flex justify-between items-center shadow hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[9px] text-slate-505 font-mono font-bold">{new Date(h.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] leading-none font-semibold">
                        <p className="text-white">Net: ₹{h.net_amount.toLocaleString()}</p>
                        <p className="text-red-400 text-[10px]">Comm: -₹{h.commission_amount.toLocaleString()}</p>
                      </div>
                      {h.settlement_batches && (
                        <p className="text-[9px] font-mono text-slate-500 truncate font-bold">Ref: {h.settlement_batches.batch_reference}</p>
                      )}
                    </div>
                    <div className="shrink-0 select-none">
                      {getPayoutStatusBadge(h.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
