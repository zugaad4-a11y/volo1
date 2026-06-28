'use client';
import { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import { Wallet, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

export default function WorkerWalletDashboard() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  async function fetchWalletInfo() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const workerId = userData.user.id;

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('worker_wallets')
        .select('*')
        .eq('worker_id', workerId)
        .single();
      
      if (walletData) {
        setWallet(walletData);
      }

      // Fetch transactions
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(txns || []);
    } catch (err) {
      console.error('Failed to load wallet dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Wallet</h1>
        <p className="text-gray-400">Loading wallet data...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Wallet</h1>
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-200">No wallet found for your account. Please contact support.</p>
        </div>
      </div>
    );
  }

  const availableBalance = Number(wallet.balance) - Number(wallet.minimum_balance);
  const isBlocked = Number(wallet.balance) < Number(wallet.minimum_balance);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        Commission Wallet
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
          <p className="text-sm font-medium text-slate-400 mb-1">Current Balance</p>
          <div className={`text-4xl font-bold ${isBlocked ? 'text-red-400' : 'text-white'}`}>
            ₹{Number(wallet.balance).toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Minimum required: ₹{Number(wallet.minimum_balance).toFixed(2)}
          </p>
          {isBlocked && (
            <div className="mt-4 inline-block bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-semibold border border-red-500/50">
              Account Blocked (Negative Balance)
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl">
          <p className="text-sm font-medium text-indigo-300 mb-1">Available for Commission</p>
          <div className="text-4xl font-bold text-indigo-100">
            ₹{Math.max(0, availableBalance).toFixed(2)}
          </div>
          <p className="text-xs text-indigo-400 mt-2">
            This represents how much commission you can incur before being blocked.
          </p>
        </div>
      </div>

      {/* Ledger */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Transactions
        </h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {transactions.map((txn) => {
                const isDeduction = txn.type === 'COMMISSION_DEDUCTION' || txn.type === 'DEDUCTION';
                return (
                  <div key={txn.id} className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isDeduction ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {isDeduction ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{txn.description || txn.type}</p>
                        <p className="text-xs text-slate-400">{new Date(txn.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${isDeduction ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDeduction ? '-' : '+'}₹{Number(txn.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Bal: ₹{Number(txn.balance_after).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
