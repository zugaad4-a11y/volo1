'use client';

import React, { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { 
  Wallet, Plus, Activity, ArrowUpRight, ArrowDownRight, 
  Loader2, CreditCard, Sparkles, CheckCircle
} from 'lucide-react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to load wallet data');
  }
  return res.json();
};

export default function CustomerWalletPage() {
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR('/api/customer/wallet', fetcher);
  
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTopUp = async (amountToTopUp: number) => {
    if (isNaN(amountToTopUp) || amountToTopUp <= 0) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/customer/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToTopUp })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to top up wallet');
      }

      triggerToast(`Successfully added ₹${amountToTopUp} to Volo Wallet! 💳`);
      setTopUpAmount('');
      mutate('/api/customer/wallet');
      mutate('/api/customer/dashboard'); // Mutate dashboard cache if needed
    } catch (err: any) {
      alert(err.message || 'Error processing top up');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-450 mt-3 font-bold select-none uppercase tracking-wider font-mono">Retrieving Volo Wallet balance...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#0F172A] border border-white/[0.08] p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-2xl">
        <p className="text-xs text-red-400 font-bold font-mono">Failed to load wallet data.</p>
        <button
          onClick={() => mutate('/api/customer/wallet')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold font-mono transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { balance, transactions = [] } = data;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 select-none relative">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#0F172A] border border-white/[0.08] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in-up">
          <CheckCircle className="h-4 w-4 text-[#5CBF2A]" />
          {successMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-[#FF7A00] animate-pulse" />
            Volo Wallet
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage your digital balance, refunds, and pay instantly for bookings.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Balance & Topup */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card - Premium Charcoal layout with orange glow overlay */}
          <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#070B14] border border-white/[0.08] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Available Balance</span>
              <Sparkles className="h-4.5 w-4.5 text-[#FF7A00] animate-pulse" />
            </div>

            <h2 className="text-3xl font-display font-black tracking-tight mt-4 select-text font-mono">
              ₹{Number(balance).toFixed(2)}
            </h2>

            <div className="mt-10 flex items-center gap-2 bg-[#070B14]/60 border border-white/[0.06] px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono text-slate-300">
              <CreditCard className="h-4 w-4 text-[#FF7A00]" />
              100% Secured Vault Pay
            </div>
          </div>

          {/* Quick Topup Options */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 shadow-[#070B14]/40">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Top Up Balance</span>
            
            <div className="grid grid-cols-3 gap-2.5 select-none">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleTopUp(amt)}
                  disabled={isSubmitting}
                  className="py-2.5 bg-[#070B14] hover:bg-orange-500/10 hover:text-[#FF7A00] hover:border-[#FF7A00]/30 border border-white/[0.08] rounded-xl text-xs font-black transition-all cursor-pointer font-mono text-slate-300"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <div className="space-y-2 pt-2">
              <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider font-mono">Or Enter Custom Amount</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="flex-1 bg-[#070B14] border border-white/[0.08] focus:bg-[#070B14] focus:border-[#FF7A00] text-white rounded-xl px-3 py-2.5 text-xs font-semibold outline-none transition-all placeholder-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleTopUp(Number(topUpAmount))}
                  disabled={isSubmitting || !topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) <= 0}
                  className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 font-mono shadow-lg shadow-orange-500/10"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                  Add Cash
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions History */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1 font-mono">Transaction Ledger</span>
          
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl shadow-[#070B14]/40">
            {transactions.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 font-semibold font-mono">
                <Activity className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                No transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {transactions.map((tx: any) => {
                  const isTopUp = tx.type === 'TOP_UP' || tx.type === 'REFUND';
                  return (
                    <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isTopUp 
                            ? 'bg-green-500/10 border-green-500/20 text-[#22C55E]' 
                            : 'bg-orange-500/10 border-[#FF7A00]/20 text-[#FF7A00]'
                        }`}>
                          {isTopUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-snug">{tx.description || tx.type}</p>
                          <span className="text-[9px] text-slate-450 block font-bold leading-none mt-1 font-mono">
                            {new Date(tx.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono ${
                          isTopUp ? 'text-[#22C55E]' : 'text-slate-200'
                        }`}>
                          {isTopUp ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
