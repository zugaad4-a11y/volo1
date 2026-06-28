'use client';

import React, { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import SearchInput from '@/components/admin/shared/SearchInput';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  RotateCcw,
  Calendar
} from 'lucide-react';

interface PaymentRow {
  id: string;
  amount: number;
  payment_mode: string;
  status: string;
  created_at: string;
  razorpay_order_id: string | null;
  bookings: { id: string } | null;
  users: { full_name: string } | null;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_mode,
          status,
          created_at,
          razorpay_order_id,
          bookings ( id ),
          users!payments_customer_id_fkey ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data as any) || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter payments dynamically
  const filteredPayments = payments.filter((p) => {
    const query = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      (p.users?.full_name || '').toLowerCase().includes(query) ||
      (p.razorpay_order_id || '').toLowerCase().includes(query)
    );
  });

  // Calculate dynamic metrics
  const successPayments = payments.filter(p => ['SUCCESS', 'CAPTURED', 'PAID'].includes(p.status.toUpperCase()));
  const pendingPayments = payments.filter(p => p.status.toUpperCase() === 'PENDING');
  const failedPayments = payments.filter(p => p.status.toUpperCase() === 'FAILED');
  const refundedPayments = payments.filter(p => p.status.toUpperCase() === 'REFUNDED');

  const successSum = successPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const pendingSum = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const failedSum = failedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const refundedSum = refundedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  const columns: Column<PaymentRow>[] = [
    { 
      key: 'id', 
      header: 'Transaction ID', 
      render: (row) => <span className="font-mono text-xs text-slate-500 font-bold">{row.id.slice(0, 8).toUpperCase()}</span> 
    },
    { 
      key: 'customer', 
      header: 'Customer', 
      render: (row) => <span className="font-bold text-slate-200">{row.users?.full_name || 'Unknown Client'}</span> 
    },
    { 
      key: 'booking', 
      header: 'Booking Link', 
      render: (row) => row.bookings ? (
        <span className="font-mono text-xs text-[#FF8A00] font-bold">BK-{row.bookings.id.slice(0, 6).toUpperCase()}</span>
      ) : (
        <span className="text-slate-600">-</span>
      )
    },
    { 
      key: 'amount', 
      header: 'Amount', 
      render: (row) => <span className="font-black text-white">₹{Number(row.amount).toFixed(2)}</span> 
    },
    { 
      key: 'payment_mode', 
      header: 'Method', 
      render: (row) => <span className="font-bold text-slate-400 font-mono uppercase text-xs">{row.payment_mode}</span> 
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (row) => <StatusBadge status={row.status} /> 
    },
    { 
      key: 'razorpay_order_id', 
      header: 'Order Reference', 
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.razorpay_order_id || '-'}</span> 
    },
    { 
      key: 'created_at', 
      header: 'Date', 
      render: (row) => <span className="font-mono text-slate-400 font-bold text-xs">{new Date(row.created_at).toLocaleString()}</span> 
    }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">Platform Transactions</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monitor client payments, Razorpay order states, and refund ledger operations.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Successful Payments</span>
            <span className="text-lg font-black text-[#22C55E] block mt-1">₹{successSum.toLocaleString()}</span>
            <span className="text-[9px] text-slate-450 font-bold block mt-1">{successPayments.length} Completed</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20 shadow">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Pending Escrows</span>
            <span className="text-lg font-black text-[#F59E0B] block mt-1">₹{pendingSum.toLocaleString()}</span>
            <span className="text-[9px] text-slate-450 font-bold block mt-1">{pendingPayments.length} Processing</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20 shadow">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Failed Checkouts</span>
            <span className="text-lg font-black text-[#EF4444] block mt-1">₹{failedSum.toLocaleString()}</span>
            <span className="text-[9px] text-slate-450 font-bold block mt-1">{failedPayments.length} Retries Needed</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/20 shadow">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Refunded Transactions</span>
            <span className="text-lg font-black text-slate-350 block mt-1">₹{refundedSum.toLocaleString()}</span>
            <span className="text-[9px] text-slate-450 font-bold block mt-1">{refundedPayments.length} Returned</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center border border-white/[0.06] shadow">
            <RotateCcw className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-xl">
        <div className="w-full lg:max-w-md">
          <SearchInput
            placeholder="Search payments by Customer, ID, or Reference..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Main Data Table */}
      {loading ? (
        <LoadingSkeleton rows={10} cols={8} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
          emptyMessage="No customer payments found matching search criteria."
        />
      )}

    </div>
  );
}
