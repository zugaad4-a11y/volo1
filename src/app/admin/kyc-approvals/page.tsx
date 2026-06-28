'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import { ShieldCheck, Search, ArrowRight, Star, RefreshCw, Briefcase, Phone, Clock } from 'lucide-react';

interface PendingWorker {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  kyc_status: string;
  rating: number;
  total_jobs: number;
  created_at: string;
}

export default function AdminKycApprovalsPage() {
  const router = useRouter();

  const [workers, setWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending workers list
  async function fetchPendingWorkers() {
    try {
      const res = await fetch('/api/admin/workers?kyc_status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error('Failed to load pending KYC workers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPendingWorkers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingWorkers();
  };

  // Filter list based on search keyword
  const filteredWorkers = workers.filter(w => 
    w.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    w.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Top action header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-rose-500" />
            KYC Approvals Queue
          </h1>
          <p className="text-xs text-slate-500">
            Review and verify technician addresses, credentials, and selfie photos before granting system job routing privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-end sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-rose-500' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Stats Summary and Search filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by technician name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold self-end md:self-auto select-none">
          Total Waiting in Queue: <span className="text-rose-400 font-bold">{workers.length} technicians</span>
        </div>
      </div>

      {/* Approvals Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={3} />
      ) : filteredWorkers.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider select-none">
                  <th className="p-4">Technician Details</th>
                  <th className="p-4">Experience Stats</th>
                  <th className="p-4">Submission Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* Name and Phone details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center font-bold text-rose-400 text-sm select-none">
                          {worker.full_name?.charAt(0) || 'T'}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200 block">{worker.full_name}</span>
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {worker.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rating / Jobs */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                          {Number(worker.rating).toFixed(2)} Rating
                        </span>
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          {worker.total_jobs} Completed Jobs
                        </span>
                      </div>
                    </td>

                    {/* Joined Date and KYC state */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <StatusBadge status={worker.kyc_status} />
                        <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3" />
                          Applied: {new Date(worker.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* View Details Redirect button */}
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/workers/${worker.id}`)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer hover:translate-x-0.5"
                      >
                        Review Profile
                        <ArrowRight className="h-3.5 w-3.5 text-rose-500" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-12 text-center select-none">
          <ShieldCheck className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Clean Approvals Queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no technicians waiting for verification reviews. All onboarding requests have been processed.
          </p>
        </div>
      )}

    </div>
  );
}
