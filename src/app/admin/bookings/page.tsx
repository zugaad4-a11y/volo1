'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchInput from '@/components/admin/shared/SearchInput';
import FilterDropdown from '@/components/admin/shared/FilterDropdown';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import Pagination from '@/components/admin/shared/Pagination';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  AlertCircle,
  FileText,
  Kanban,
  Table as TableIcon,
  Layers
} from 'lucide-react';

interface BookingRow {
  id: string;
  status: string;
  payment_mode: string;
  booking_type: string;
  total_amount: number;
  created_at: string;
  scheduled_at: string | null;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  worker_name: string | null;
  worker_phone: string | null;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [loading, setLoading] = useState(true);

  // View Mode: Table vs Kanban
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');

  async function fetchBookings() {
    setLoading(true);
    try {
      const url = `/api/admin/bookings?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}&status=${status}&payment_mode=${paymentMode}&booking_type=${bookingType}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, [page, search, status, paymentMode, bookingType]);

  // Bulk status update callback mock
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (confirm(`Change booking status to ${newStatus.replace(/_/g, ' ')}?`)) {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          await fetchBookings();
        }
      } catch (e) {
        console.error('Failed to update status:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const columns: Column<BookingRow>[] = [
    { key: 'id', header: 'Booking ID', render: (row) => <span className="font-mono text-xs text-slate-500 font-bold">{row.id.slice(0, 8).toUpperCase()}</span> },
    { key: 'customer_name', header: 'Customer' },
    { key: 'service_name', header: 'Service' },
    { 
      key: 'worker_name', 
      header: 'Worker', 
      render: (row) => row.worker_name ? (
        <span className="font-semibold text-slate-200">{row.worker_name}</span>
      ) : (
        <span className="text-[#F59E0B] font-bold uppercase text-[10px] bg-[#F59E0B]/10 px-2 py-0.5 border border-[#F59E0B]/20 rounded-lg">Unassigned</span>
      )
    },
    { key: 'booking_type', header: 'Type' },
    { key: 'payment_mode', header: 'Payment' },
    {
      key: 'total_amount',
      header: 'Amount (₹)',
      render: (row) => <span className="font-black text-slate-200">₹{Number(row.total_amount).toFixed(2)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => <span className="font-mono font-bold text-xs">{new Date(row.created_at).toLocaleDateString()}</span>
    }
  ];

  // Group bookings for Kanban Board Columns
  const kanbanColumns = {
    PENDING: bookings.filter(b => ['PENDING_ASSIGNMENT', 'WORKER_REJECTED'].includes(b.status)),
    ASSIGNED: bookings.filter(b => ['WORKER_ASSIGNED', 'WORKER_ACCEPTED'].includes(b.status)),
    WORKING: bookings.filter(b => b.status === 'IN_PROGRESS'),
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED')
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">Bookings Desk</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Audit customer bookings status, allocate available technicians, and verify payouts.</p>
        </div>
        
        {/* Toggle between Table View & Kanban View */}
        <div className="flex bg-[#111827] p-0.5 rounded-xl border border-[#1F2937] text-[10px] font-black uppercase font-mono">
          <button
            type="button"
            onClick={() => setViewMode('TABLE')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'TABLE' ? 'bg-[#FF8A00] text-white' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Table View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('KANBAN')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'KANBAN' ? 'bg-[#FF8A00] text-white' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" /> Kanban Board
          </button>
        </div>
      </div>

      {/* Top Status Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Pending Dispatch</span>
            <span className="text-xl font-black text-[#F59E0B] block mt-1">
              {bookings.filter(b => ['PENDING_ASSIGNMENT', 'WORKER_REJECTED'].includes(b.status)).length} Bookings
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20 shadow">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Assigned Jobs</span>
            <span className="text-xl font-black text-[#3B82F6] block mt-1">
              {bookings.filter(b => ['WORKER_ASSIGNED', 'WORKER_ACCEPTED'].includes(b.status)).length} Techs
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/20 shadow">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Active In-Progress</span>
            <span className="text-xl font-black text-[#FF8A00] block mt-1">
              {bookings.filter(b => b.status === 'IN_PROGRESS').length} Active
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-[#FF8A00] flex items-center justify-center border border-orange-500/20 shadow">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Completed Jobs</span>
            <span className="text-xl font-black text-[#22C55E] block mt-1">
              {bookings.filter(b => b.status === 'COMPLETED').length} Finished
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20 shadow">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-xl">
        <SearchInput
          placeholder="Search by customer phone, name or ID..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <FilterDropdown
            label="Service Status"
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending Assignment', value: 'PENDING_ASSIGNMENT' },
              { label: 'Worker Assigned', value: 'WORKER_ASSIGNED' },
              { label: 'Worker Accepted', value: 'WORKER_ACCEPTED' },
              { label: 'Worker Rejected', value: 'WORKER_REJECTED' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Cancelled', value: 'CANCELLED' }
            ]}
          />

          <FilterDropdown
            label="Payment Mode"
            value={paymentMode}
            onChange={(val) => {
              setPaymentMode(val);
              setPage(1);
            }}
            options={[
              { label: 'All Payments', value: '' },
              { label: 'Online Card', value: 'ONLINE' },
              { label: 'Cash (COD)', value: 'COD' }
            ]}
          />

          <FilterDropdown
            label="Booking Type"
            value={bookingType}
            onChange={(val) => {
              setBookingType(val);
              setPage(1);
            }}
            options={[
              { label: 'All Types', value: '' },
              { label: 'Instant request', value: 'INSTANT' },
              { label: 'Scheduled job', value: 'SCHEDULED' }
            ]}
          />
        </div>
      </div>

      {/* RENDER VIEW METHOD */}
      {loading ? (
        <LoadingSkeleton rows={10} cols={8} />
      ) : viewMode === 'TABLE' ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={bookings}
            onRowClick={(row) => router.push(`/admin/bookings/${row.id}`)}
            emptyMessage="No bookings matching selected filters."
          />

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            totalResults={total}
            limit={limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      ) : (
        /* KANBAN BOARD VIEW LAYOUT */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start mt-2">
          
          {/* Column 1: Pending */}
          <div className="bg-[#0A0F1E] border border-[#1F2937] p-4.5 rounded-3xl space-y-4.5">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-xs font-black text-[#F59E0B] uppercase font-mono tracking-wider">Pending Assignment</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#F59E0B]/10 text-[#F59E0B] font-mono border border-[#F59E0B]/20">{kanbanColumns.PENDING.length}</span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.PENDING.map(b => (
                <div key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)} className="bg-[#111827] border border-[#1F2937] hover:border-[#FF8A00]/40 p-4 rounded-2xl space-y-3 shadow transition-all hover:scale-[1.01] cursor-pointer">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                    <span>{b.id.slice(0, 8).toUpperCase()}</span>
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight uppercase font-mono">{b.service_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Client: {b.customer_name}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-[#1F2937]/50 pt-2.5">
                    <span className="font-mono font-bold text-slate-350">₹{Number(b.total_amount).toLocaleString()}</span>
                    <Link href="/admin/manual-assignments" className="px-2.5 py-1 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white font-black uppercase tracking-wider text-[9px] rounded-lg shadow font-mono">Assign</Link>
                  </div>
                </div>
              ))}
              {kanbanColumns.PENDING.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[#64748B] font-bold uppercase tracking-wider">No pending items.</div>
              )}
            </div>
          </div>

          {/* Column 2: Assigned */}
          <div className="bg-[#0A0F1E] border border-[#1F2937] p-4.5 rounded-3xl space-y-4.5">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-xs font-black text-[#3B82F6] uppercase font-mono tracking-wider">Assigned Tech</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#3B82F6]/10 text-[#3B82F6] font-mono border border-[#3B82F6]/20">{kanbanColumns.ASSIGNED.length}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.ASSIGNED.map(b => (
                <div key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)} className="bg-[#111827] border border-[#1F2937] hover:border-[#3B82F6]/40 p-4 rounded-2xl space-y-3 shadow transition-all hover:scale-[1.01] cursor-pointer">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                    <span>{b.id.slice(0, 8).toUpperCase()}</span>
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight uppercase font-mono">{b.service_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Tech: {b.worker_name || 'Assigned'}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-[#1F2937]/50 pt-2.5">
                    <span className="font-mono font-bold text-slate-350">₹{Number(b.total_amount).toLocaleString()}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(b.id, 'IN_PROGRESS'); }} className="px-2.5 py-1 bg-[#3B82F6] hover:bg-[#3B82F6]/80 text-white font-black uppercase tracking-wider text-[9px] rounded-lg shadow font-mono cursor-pointer">Start Job</button>
                  </div>
                </div>
              ))}
              {kanbanColumns.ASSIGNED.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[#64748B] font-bold uppercase tracking-wider">No assigned items.</div>
              )}
            </div>
          </div>

          {/* Column 3: In Progress */}
          <div className="bg-[#0A0F1E] border border-[#1F2937] p-4.5 rounded-3xl space-y-4.5">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-xs font-black text-[#FF8A00] uppercase font-mono tracking-wider">In Progress</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-orange-500/10 text-[#FF8A00] font-mono border border-orange-500/20">{kanbanColumns.WORKING.length}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.WORKING.map(b => (
                <div key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)} className="bg-[#111827] border border-[#1F2937] hover:border-[#FF8A00]/40 p-4 rounded-2xl space-y-3 shadow transition-all hover:scale-[1.01] cursor-pointer">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                    <span>{b.id.slice(0, 8).toUpperCase()}</span>
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight uppercase font-mono">{b.service_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Tech: {b.worker_name || 'Working'}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-[#1F2937]/50 pt-2.5">
                    <span className="font-mono font-bold text-slate-350">₹{Number(b.total_amount).toLocaleString()}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(b.id, 'COMPLETED'); }} className="px-2.5 py-1 bg-[#22C55E] hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[9px] rounded-lg shadow font-mono cursor-pointer">Complete</button>
                  </div>
                </div>
              ))}
              {kanbanColumns.WORKING.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[#64748B] font-bold uppercase tracking-wider">No active jobs en route.</div>
              )}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="bg-[#0A0F1E] border border-[#1F2937] p-4.5 rounded-3xl space-y-4.5">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-xs font-black text-[#22C55E] uppercase font-mono tracking-wider">Completed</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#22C55E]/10 text-[#22C55E] font-mono border border-[#22C55E]/20">{kanbanColumns.COMPLETED.length}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.COMPLETED.map(b => (
                <div key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)} className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl space-y-3 shadow transition-all hover:scale-[1.01] cursor-pointer">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                    <span>{b.id.slice(0, 8).toUpperCase()}</span>
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight uppercase font-mono">{b.service_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Tech: {b.worker_name || 'Completed'}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-[#1F2937]/50 pt-2.5">
                    <span className="font-mono font-bold text-slate-350">₹{Number(b.total_amount).toLocaleString()}</span>
                    <span className="text-[#22C55E] font-black uppercase text-[9px] font-mono">Archived</span>
                  </div>
                </div>
              ))}
              {kanbanColumns.COMPLETED.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[#64748B] font-bold uppercase tracking-wider">No completed records.</div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
