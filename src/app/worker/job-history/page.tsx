'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  History, Calendar, Search, Filter, ChevronLeft, ChevronRight, 
  Loader2, AlertCircle, IndianRupee, CheckCircle2, XCircle, X
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorkerJobHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: '10',
    search,
    status,
    date_from: dateFrom,
    date_to: dateTo
  });

  const { data, error, isLoading } = useSWR(`/api/worker/job-history?${queryParams.toString()}`, fetcher);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = search || status || dateFrom || dateTo;

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <History className="h-5 w-5 text-[#FF7A00]" />
          Job History Archive
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">View and search through your completed and cancelled service dispatch records.</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
        
        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-[#FF7A00] transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by service name..."
            className="w-full bg-[#070B14]/60 border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 font-semibold outline-none transition-all focus:bg-[#070B14] focus:ring-4 focus:ring-orange-500/5"
          />
        </div>

        {/* Status and Date Range Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
              <Filter className="h-3 w-3 text-[#FF7A00]" />
              Status Filter
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-200 font-bold outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#FF7A00]" />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-200 font-mono outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#FF7A00]" />
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-200 font-mono outline-none transition-all"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF7A00] hover:text-[#FF9E43] transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* History Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Loading archived dispatches...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl text-center text-xs text-red-400 font-bold">
          Failed to load job history logs.
        </div>
      ) : !data?.history || data.history.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-14 text-center select-none space-y-3">
          <History className="h-10 w-10 text-slate-700 mx-auto" />
          <h4 className="font-black text-slate-300 text-sm">No History Records Found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-semibold">
            No completed or cancelled bookings were found matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.history.map((item: any) => (
            <div 
              key={item.id} 
              className="bg-[#0F172A] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-200 text-xs leading-none">{item.service_name}</h3>
                  {item.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20">
                      <CheckCircle2 className="h-2.5 w-2.5" />Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                      <XCircle className="h-2.5 w-2.5" />Cancelled
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-semibold truncate">{item.customer_area}</p>
                <span className="text-[9px] text-slate-600 font-mono font-bold">
                  {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[8px] uppercase font-black text-slate-600 block select-none">Net Earnings</span>
                <div className="flex items-center justify-end gap-0.5 text-xs font-black text-white mt-1">
                  <IndianRupee className="h-3 w-3 text-[#FF7A00] shrink-0" />
                  <span>₹{item.earnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Footer */}
          {data.totalPages > 1 && (
            <div className="flex justify-between items-center bg-[#0F172A] border border-white/[0.08] rounded-2xl px-5 py-3 text-xs select-none">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-bold uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              
              <span className="text-slate-500 font-bold">
                Page <span className="text-white">{page}</span> of <span className="text-white">{data.totalPages}</span>
              </span>

              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-bold uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
