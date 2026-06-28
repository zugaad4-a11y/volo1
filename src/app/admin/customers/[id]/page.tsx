'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import ConfirmModal from '@/components/admin/shared/ConfirmModal';
import DataTable, { Column } from '@/components/admin/shared/DataTable';

interface CustomerDetail {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  bookings: any[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  async function fetchCustomer() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) {
        router.push('/admin/customers');
        return;
      }
      const data = await res.json();
      setCustomer(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!customer) return;
    setActionLoading(true);
    const action = customer.is_active ? 'DEACTIVATE' : 'ACTIVATE';
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        fetchCustomer();
        setShowStatusModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !customer) {
    return <LoadingSkeleton rows={6} cols={3} />;
  }

  const bookingColumns: Column<any>[] = [
    { key: 'id', header: 'Booking ID', render: (row) => <span className="font-mono text-xs text-slate-400">{row.id.slice(0, 8)}</span> },
    { key: 'service_name', header: 'Service' },
    { key: 'total_amount', header: 'Amount (₹)', render: (row) => `₹${Number(row.total_amount).toFixed(2)}` },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">{customer.full_name || 'Customer Profile'}</h1>
          <p className="text-xs text-slate-500">Customer ID: {customer.id}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/customers')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors select-none"
        >
          Back to list
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card - Profile info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-rose-450 text-3xl font-bold select-none overflow-hidden">
              {customer.full_name?.charAt(0) || 'C'}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{customer.full_name || 'Incomplete Profile'}</h3>
              <p className="text-xs text-slate-500">{customer.phone}</p>
              <p className="text-xs text-slate-500">{customer.email || 'No email registered'}</p>
            </div>
            <StatusBadge status={customer.is_active ? 'ACTIVE' : 'SUSPENDED'} />
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Joined On</span>
              <span className="font-semibold text-slate-200">
                {new Date(customer.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Bookings</span>
              <span className="font-semibold text-slate-200">{customer.bookings.length}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
              customer.is_active
                ? 'bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {customer.is_active ? 'Deactivate Customer' : 'Activate Customer'}
          </button>
        </div>

        {/* Right Columns - Booking History */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 select-none">Booking History</h3>
          <DataTable
            columns={bookingColumns}
            data={customer.bookings}
            onRowClick={(row) => router.push(`/admin/bookings/${row.id}`)}
            emptyMessage="Customer has not placed any bookings yet"
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusToggle}
        title={customer.is_active ? 'Deactivate Customer Account' : 'Activate Customer Account'}
        message={
          customer.is_active
            ? 'Deactivated customers will be unable to log in or schedule new bookings. Confirm deactivation?'
            : 'Re-activate this customer account?'
        }
        confirmText={customer.is_active ? 'Deactivate' : 'Activate'}
        isLoading={actionLoading}
      />
    </div>
  );
}
