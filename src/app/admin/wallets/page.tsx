'use client';
import { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';

export default function AdminWallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      const { data, error } = await supabase
        .from('worker_wallets')
        .select(`
          id,
          balance,
          minimum_balance,
          is_active,
          workers!inner (
            id,
            users!inner (
              full_name,
              phone
            )
          )
        `)
        .order('balance', { ascending: true });

      if (error) throw error;
      setWallets(data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Worker Wallets</h1>
        <p className="text-gray-400">Loading wallets...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Worker Wallets Dashboard</h1>
      <p className="text-gray-400 mb-6">Manage and view all worker wallet balances.</p>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Minimum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {wallet.workers?.users?.full_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {wallet.workers?.users?.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${wallet.balance < wallet.minimum_balance ? 'text-red-500' : 'text-green-400'}`}>
                      ₹{Number(wallet.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    ₹{Number(wallet.minimum_balance).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${wallet.balance < wallet.minimum_balance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {wallet.balance < wallet.minimum_balance ? 'Blocked' : 'Eligible'}
                    </span>
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No wallets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
