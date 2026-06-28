'use client';
 
import React, { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import Pagination from '@/components/admin/shared/Pagination';
import FilterDropdown from '@/components/admin/shared/FilterDropdown';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { Shield, Calendar, Eye, RefreshCw, X, Terminal } from 'lucide-react';
 
interface AuditLog {
  id: string;
  timestamp: string;
  admin_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
}
 
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
 
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
 
  // Metadata Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
 
  // Fetch audit logs from API
  async function fetchLogs() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '15',
        action: actionFilter,
        date_from: dateFrom,
        date_to: dateTo
      });
 
      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, dateFrom, dateTo]);
 
  const handleResetFilters = () => {
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };
 
  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return 'bg-blue-550/10 text-blue-400 border-blue-500/20';
    if (act.includes('APPROVED') || act.includes('ACTIVATED') || act.includes('CREATED')) {
      return 'bg-emerald-550/10 text-emerald-450 border-emerald-500/20';
    }
    if (act.includes('REJECTED') || act.includes('SUSPENDED') || act.includes('DEACTIVATED') || act.includes('DELETED') || act.includes('CANCELLED')) {
      return 'bg-red-550/10 text-red-450 border-red-500/20';
    }
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };
 
  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-slate-400 font-mono font-bold flex items-center gap-1.5 select-none">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          {new Date(row.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
        </span>
      )
    },
    {
      key: 'admin_name',
      header: 'Administrator',
      render: (row) => <span className="font-bold text-white uppercase tracking-wide">{row.admin_name}</span>
    },
    {
      key: 'action',
      header: 'Action Performed',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border font-mono uppercase tracking-wider select-none ${getActionBadgeColor(row.action)}`}>
          {row.action.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'target_type',
      header: 'Target Identity',
      render: (row) => (
        <span className="text-xs text-slate-400 font-bold capitalize select-all">
          {row.target_type ? `${row.target_type.toLowerCase()} (${row.target_id?.slice(0, 8)})` : 'N/A'}
        </span>
      )
    },
    {
      key: 'metadata',
      header: 'Metadata Payload',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-transparent hover:bg-[#172033] text-brand-primary border border-[#1F2937] hover:border-slate-750 rounded-xl transition-all cursor-pointer select-none"
        >
          <Eye className="h-3.5 w-3.5" />
          Payload
        </button>
      )
    }
  ];
 
  const auditActions = [
    { label: 'All Action Log Types', value: '' },
    { label: 'Admin Login', value: 'ADMIN_LOGIN' },
    { label: 'Worker KYC Approved', value: 'WORKER_KYC_APPROVED' },
    { label: 'Worker KYC Rejected', value: 'WORKER_KYC_REJECTED' },
    { label: 'Worker Suspended', value: 'WORKER_SUSPENDED' },
    { label: 'Worker Activated', value: 'WORKER_ACTIVATED' },
    { label: 'Manual Assignment', value: 'MANUAL_ASSIGNMENT' },
    { label: 'Manual Reassignment', value: 'MANUAL_REASSIGNMENT' },
    { label: 'Service Created', value: 'SERVICE_CREATED' },
    { label: 'Service Updated', value: 'SERVICE_UPDATED' },
    { label: 'Service Deleted', value: 'SERVICE_DELETED' },
    { label: 'Settings Updated', value: 'SETTINGS_UPDATED' },
    { label: 'Customer Activated', value: 'CUSTOMER_ACTIVATED' },
    { label: 'Customer Deactivated', value: 'CUSTOMER_DEACTIVATED' },
    { label: 'Booking Cancelled', value: 'BOOKING_CANCELLED' }
  ];
 
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none flex items-center gap-2.5">
            <Shield className="h-6.5 w-6.5 text-brand-primary" />
            System Audit Logs
          </h1>
          <p className="text-xs text-slate-450 select-none font-medium">
            Track and verify platform administrative updates, partner KYC reviews, manual assignments, and configuration changes.
          </p>
        </div>
      </div>
 
      {/* Filters Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end bg-[#111827] border border-[#1F2937] rounded-2xl p-4 shadow-md">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Action Category</label>
          <FilterDropdown
            options={auditActions}
            value={actionFilter}
            onChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full h-[38px] rounded-xl border border-[#1F2937] bg-[#070B14] px-3.5 text-xs font-semibold text-slate-200 outline-none focus:border-brand-primary/55 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full h-[38px] rounded-xl border border-[#1F2937] bg-[#070B14] px-3.5 text-xs font-semibold text-slate-200 outline-none focus:border-brand-primary/55 transition-colors"
          />
        </div>
        <div>
          <button
            onClick={handleResetFilters}
            className="w-full h-[38px] px-4 py-2 text-xs font-black uppercase tracking-wider bg-transparent hover:bg-[#172033] text-slate-400 border border-[#1F2937] rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        </div>
      </div>
 
      {/* Logs Table */}
      {loading ? (
        <LoadingSkeleton rows={8} cols={5} />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={logs}
            emptyMessage="No system audit logs recorded matching criteria."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalResults={totalItems}
            limit={15}
            onPageChange={setPage}
          />
        </div>
      )}
 
      {/* Metadata Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-brand-primary" />
                Audit Payload Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-[#172033] rounded text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
 
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 text-xs gap-y-2.5 text-slate-400 bg-[#070B14]/40 p-4 rounded-2xl border border-white/[0.04]">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Action:</span>
                <span className="text-white font-black font-mono tracking-wide">{selectedLog.action}</span>
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Admin:</span>
                <span className="text-slate-200 font-bold uppercase">{selectedLog.admin_name}</span>
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Timestamp:</span>
                <span className="text-slate-300 font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                {selectedLog.target_type && (
                  <>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Target Type:</span>
                    <span className="text-slate-200 font-bold capitalize">{selectedLog.target_type.toLowerCase()}</span>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Target ID:</span>
                    <span className="text-slate-350 font-mono select-all text-[11px]">{selectedLog.target_id}</span>
                  </>
                )}
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Metadata JSON Payload</label>
                <pre className="text-[11px] font-mono text-slate-300 p-4 bg-[#070B14] rounded-xl overflow-x-auto max-h-60 border border-white/[0.04] no-scrollbar">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
 
            <div className="flex justify-end pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-all shadow-lg shadow-brand-primary/10 cursor-pointer select-none active:scale-95 duration-150"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
