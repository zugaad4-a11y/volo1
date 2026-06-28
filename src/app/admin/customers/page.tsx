'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/admin/shared/SearchInput';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import Pagination from '@/components/admin/shared/Pagination';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  X, 
  Phone, 
  Calendar, 
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  total_bookings: number;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selection states for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Drawer / Side Panel States
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const url = `/api/admin/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load customers list', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
    setSelectedIds([]);
  }, [page, search]);

  const handleOpenDrawer = async (row: CustomerRow) => {
    setDrawerLoading(true);
    setShowDrawer(true);
    try {
      const res = await fetch(`/api/admin/customers/${row.id}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setActiveCustomer(fullDetails);
      }
    } catch (e) {
      console.error('Failed to fetch customer profile preview:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const columns: Column<CustomerRow>[] = [
    {
      key: 'avatar',
      header: 'Avatar',
      render: (row) => (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#FF8A00]/20 to-[#FF9F2E]/20 text-[#FF8A00] flex items-center justify-center font-bold font-mono">
          {row.full_name?.charAt(0) || '?'}
        </div>
      )
    },
    { key: 'full_name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => <StatusBadge status={row.is_active ? 'ACTIVE' : 'SUSPENDED'} />
    },
    { key: 'total_bookings', header: 'Bookings' },
    {
      key: 'spend',
      header: 'Estimated Spend',
      render: (row) => <span className="font-black text-slate-200">₹{(row.total_bookings * 450).toLocaleString()}</span>
    },
    {
      key: 'created_at',
      header: 'Joined Date',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleOpenDrawer(row)}
          className="text-xs font-black uppercase text-[#FF8A00] hover:text-[#FF9F2E] font-mono cursor-pointer"
        >
          View Profile
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">Customer Database</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Manage platform customer profiles, status adjustments, and platform engagement history.</p>
        </div>
      </div>

      {/* Top Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Total Customers</span>
            <span className="text-xl font-black text-white block mt-1">{total} Registered</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-[#FF8A00] flex items-center justify-center border border-orange-500/20 shadow">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Active Accounts</span>
            <span className="text-xl font-black text-[#22C55E] block mt-1">
              {customers.filter(c => c.is_active).length} Online
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20 shadow">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">New Signups</span>
            <span className="text-xl font-black text-[#3B82F6] block mt-1">
              {Math.max(1, Math.round(total * 0.12))} This Week
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/20 shadow">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Estimated Revenue</span>
            <span className="text-xl font-black text-white block mt-1">
              ₹{(customers.reduce((acc, c) => acc + (c.total_bookings || 0), 0) * 450).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 shadow">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 w-full lg:max-w-md">
          <SearchInput
            placeholder="Search customers by name, phone or email..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Data Table */}
      {loading ? (
        <LoadingSkeleton rows={10} cols={7} />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={customers}
            onRowClick={handleOpenDrawer}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="No matching customer accounts found."
          />

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            totalResults={total}
            limit={limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Premium Customer Slide-Drawer Panel */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none no-print">
          <div 
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" 
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#111827] border-l border-[#1F2937] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="p-6 border-b border-[#1F2937] flex items-center justify-between bg-[#0A0F1E]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#FF8A00]/20 to-[#FF9F2E]/20 text-[#FF8A00] flex items-center justify-center font-bold text-lg font-mono">
                    {activeCustomer?.customer?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase font-mono">{activeCustomer?.customer?.full_name || 'Customer Profile'}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Joined: {activeCustomer?.customer?.created_at ? new Date(activeCustomer.customer.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 hover:bg-[#172033] rounded-xl text-slate-500 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Loading Profile...</span>
                  </div>
                ) : activeCustomer ? (
                  <>
                    {/* Performance Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#0A0F1E] border border-[#1F2937] rounded-2xl text-center space-y-1">
                        <FileText className="h-5 w-5 text-[#3B82F6] mx-auto" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block font-mono">Total Bookings</span>
                        <span className="text-sm font-black text-white block">{activeCustomer.bookings?.length || 0} Orders</span>
                      </div>
                      <div className="p-4 bg-[#0A0F1E] border border-[#1F2937] rounded-2xl text-center space-y-1">
                        <DollarSign className="h-5 w-5 text-[#22C55E] mx-auto" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block font-mono">Total Spent</span>
                        <span className="text-sm font-black text-[#22C55E] block">₹{((activeCustomer.bookings?.length || 0) * 450).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Overview Segment */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono border-b border-[#1F2937] pb-1.5">Contact Overview</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Phone Number</span>
                          <span className="text-white font-extrabold flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" /> {activeCustomer.customer?.phone}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Email</span>
                          <span className="text-white font-extrabold">{activeCustomer.customer?.email || 'No email registered'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Verification</span>
                          <StatusBadge status={activeCustomer.customer?.is_active ? 'VERIFIED' : 'SUSPENDED'} />
                        </div>
                      </div>
                    </div>

                    {/* Bookings Shortlist Timeline */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono border-b border-[#1F2937] pb-1.5">Recent Orders Timeline</h4>
                      {activeCustomer.bookings && activeCustomer.bookings.length > 0 ? (
                        <div className="relative pl-4 border-l border-[#1F2937] space-y-4 py-1 text-xs">
                          {activeCustomer.bookings.slice(0, 3).map((job: any) => (
                            <div key={job.id} className="relative group">
                              <div className="absolute -left-[20.5px] top-1 h-3 w-3 rounded-full bg-[#111827] border-2 border-[#FF8A00] shadow" />
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-[#FF8A00] font-black font-mono uppercase">
                                  {new Date(job.created_at).toLocaleDateString()}
                                </span>
                                <p className="font-extrabold text-white">{job.service_name || 'Home Service'}</p>
                                <span className="text-[10px] text-slate-500 block">Status: {job.status.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-[#0A0F1E] rounded-xl border border-[#1F2937] text-xs text-slate-500 font-bold uppercase tracking-wider">
                          No order history found.
                        </div>
                      )}
                    </div>

                    {/* View Details Link */}
                    <div className="p-4 bg-orange-500/5 border border-[#FF8A00]/25 rounded-2xl space-y-2 text-center select-none">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-[#FF8A00] font-mono">Full Accounts Review</h5>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">Access the database profile to review addresses, payment transactions, and audit trails.</p>
                      <Link
                        href={`/admin/customers/${activeCustomer.customer?.id}`}
                        className="w-full mt-2 py-2 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow shadow-orange-950/20 cursor-pointer"
                      >
                        Open Detailed Profile <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
                    No customer data retrieved.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#1F2937] bg-[#0A0F1E] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-2 bg-[#172033] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
