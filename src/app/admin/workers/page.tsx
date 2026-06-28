'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/admin/shared/SearchInput';
import FilterDropdown from '@/components/admin/shared/FilterDropdown';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import Pagination from '@/components/admin/shared/Pagination';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { 
  Users, 
  HardHat, 
  CheckCircle, 
  ShieldAlert, 
  Download, 
  X, 
  ExternalLink, 
  Phone, 
  Star, 
  Layers,
  Award,
  Wallet,
  Settings,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface WorkerRow {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  kyc_status: string;
  rating: number;
  total_jobs: number;
  commission_wallet_balance: number;
  created_at: string;
}

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Selection states for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Drawer / Side Panel States
  const [activeWorker, setActiveWorker] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  async function fetchWorkers() {
    setLoading(true);
    try {
      const url = `/api/admin/workers?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}&status=${status}&kyc_status=${kycStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load workers list', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkers();
    setSelectedIds([]);
  }, [page, search, status, kycStatus]);

  // Handle open worker profile slide-over panel
  const handleOpenDrawer = async (row: WorkerRow) => {
    setDrawerLoading(true);
    setShowDrawer(true);
    try {
      const res = await fetch(`/api/admin/workers/${row.id}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setActiveWorker(fullDetails);
      }
    } catch (e) {
      console.error('Failed to fetch worker profile preview:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Bulk status update action
  const handleBulkSuspend = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to suspend the ${selectedIds.length} selected workers?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedIds.map(id => 
          fetch(`/api/admin/workers/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SUSPEND' })
          })
        ));
        setSelectedIds([]);
        await fetchWorkers();
      } catch (err) {
        console.error('Failed to suspend workers', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Status', 'KYC Status', 'Rating', 'Jobs', 'Balance', 'Joined'];
    const rows = workers.map(w => [
      w.id,
      w.full_name,
      w.phone,
      w.status,
      w.kyc_status,
      w.rating,
      w.total_jobs,
      w.commission_wallet_balance,
      new Date(w.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `workers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<WorkerRow>[] = [
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
    {
      key: 'kyc_status',
      header: 'KYC Status',
      render: (row) => <StatusBadge status={row.kyc_status} />
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="font-bold text-amber-400 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400" />
          {Number(row.rating).toFixed(2)}
        </span>
      )
    },
    { key: 'total_jobs', header: 'Jobs Completed' },
    {
      key: 'commission_wallet_balance',
      header: 'Balance (₹)',
      render: (row) => <span className="font-black text-slate-200">₹{Number(row.commission_wallet_balance).toFixed(2)}</span>
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
          View Drawer
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">Workforce Database</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Manage onboarding pipelines, background document checks, and status switches.</p>
        </div>
        <button 
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#172033] border border-[#1F2937] text-slate-350 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow active:scale-95"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Top Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Total Partners</span>
            <span className="text-xl font-black text-white block mt-1">{total} Registered</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-[#FF8A00] flex items-center justify-center border border-orange-500/20 shadow">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Online Status</span>
            <span className="text-xl font-black text-[#22C55E] block mt-1">
              {workers.filter(w => w.status === 'ONLINE').length} Active
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20 shadow">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">KYC Audits</span>
            <span className="text-xl font-black text-[#F59E0B] block mt-1">
              {workers.filter(w => w.kyc_status === 'PENDING').length} Pending
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20 shadow">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Average Rating</span>
            <span className="text-xl font-black text-amber-400 block mt-1">★ 4.85</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 shadow">
            <Star className="h-5 w-5 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 w-full lg:max-w-md">
          <SearchInput
            placeholder="Search partners by name, phone or code..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkSuspend}
              className="px-3.5 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Suspend Selected ({selectedIds.length})
            </button>
          )}
        </div>

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
              { label: 'Online', value: 'ONLINE' },
              { label: 'Offline', value: 'OFFLINE' },
              { label: 'On Job', value: 'ON_JOB' },
              { label: 'Suspended', value: 'SUSPENDED' }
            ]}
          />

          <FilterDropdown
            label="Document Status"
            value={kycStatus}
            onChange={(val) => {
              setKycStatus(val);
              setPage(1);
            }}
            options={[
              { label: 'All KYC statuses', value: '' },
              { label: 'Pending Audit', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' }
            ]}
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
            data={workers}
            onRowClick={handleOpenDrawer}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            emptyMessage="No matching field partners found."
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

      {/* Premium Profile Side-Drawer Panel (Stripe & Linear style overlay) */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none no-print">
          {/* Overlay backdrop */}
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
                    {activeWorker?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase font-mono">{activeWorker?.full_name || 'Worker Details'}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">ID: {activeWorker?.worker_id_code || 'N/A'}</p>
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

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Retrieving Profile...</span>
                  </div>
                ) : activeWorker ? (
                  <>
                    {/* Performance Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#0A0F1E] border border-[#1F2937] rounded-2xl text-center space-y-1">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400 mx-auto" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block font-mono">Rating</span>
                        <span className="text-sm font-black text-white block">★ {Number(activeWorker.rating).toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-[#0A0F1E] border border-[#1F2937] rounded-2xl text-center space-y-1">
                        <Award className="h-5 w-5 text-[#22C55E] mx-auto" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block font-mono">Total Jobs</span>
                        <span className="text-sm font-black text-white block">{activeWorker.total_jobs} Completed</span>
                      </div>
                    </div>

                    {/* Overview Segment */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono border-b border-[#1F2937] pb-1.5">Overview</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Phone</span>
                          <span className="text-white font-extrabold flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" /> {activeWorker.phone}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Email</span>
                          <span className="text-white font-extrabold">{activeWorker.email || 'No Email Registered'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Wallet Balance</span>
                          <span className="text-[#22C55E] font-black">₹{Number(activeWorker.commission_wallet_balance).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-semibold">Joined On</span>
                          <span className="text-white font-extrabold font-mono">{new Date(activeWorker.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono border-b border-[#1F2937] pb-1.5">KYC Documents Pipeline</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-3 bg-[#0A0F1E] border border-[#1F2937] rounded-xl text-xs">
                          <span className="text-slate-300 font-bold">Document Status</span>
                          <StatusBadge status={activeWorker.kyc_status} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#0A0F1E] border border-[#1F2937] rounded-xl text-xs">
                          <span className="text-slate-300 font-bold">Duty Status</span>
                          <StatusBadge status={activeWorker.status} />
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation */}
                    <div className="p-4 bg-orange-500/5 border border-[#FF8A00]/25 rounded-2xl space-y-2 text-center select-none">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-[#FF8A00] font-mono">Full Operations Review</h5>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">Open the worker details center to audit identities, settlement ledgers, and KYC document reviews.</p>
                      <Link
                        href={`/admin/workers/${activeWorker.id}`}
                        className="w-full mt-2 py-2 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow shadow-orange-950/20 cursor-pointer"
                      >
                        Open Details Panel <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Failed to fetch profile details.
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
