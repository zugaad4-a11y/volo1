'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { 
  Briefcase, MapPin, Navigation, Clock, IndianRupee, Check, 
  X, ChevronRight, Loader2, AlertCircle, CalendarClock 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type JobTab = 'new' | 'active' | 'cancelled';

interface JobItem {
  id: string;
  service_name: string;
  customer_first_name: string;
  locality: string;
  distance_km?: number;
  scheduled_at: string;
  estimated_earnings: number;
  status: string;
}

export default function WorkerJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<JobTab>('new');
  
  const { data, error, isLoading } = useSWR(`/api/worker/jobs?tab=${activeTab}`, fetcher, {
    refreshInterval: 20000 
  });

  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const handleAcceptJob = async (jobId: string) => {
    setActioningId(jobId);
    setActionError('');
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept booking.');
      
      mutate(`/api/worker/jobs?tab=${activeTab}`);
      router.push(`/worker/jobs/${jobId}`);
    } catch (err: any) {
      setActionError(err.message || 'Error accepting service request.');
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    setActioningId(jobId);
    setActionError('');
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject booking.');
      
      mutate(`/api/worker/jobs?tab=${activeTab}`);
    } catch (err: any) {
      setActionError(err.message || 'Error rejecting service request.');
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-orange-500/10 text-[#FF7A00] border border-orange-500/20 shadow-sm animate-pulse">Broadcast</span>;
      case 'WORKER_ASSIGNED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">Direct Assigned</span>;
      case 'WORKER_ACCEPTED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-blue-500/10 text-sky-400 border border-blue-500/20 shadow-sm">Accepted</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 shadow-sm animate-pulse">En Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 shadow-sm">Arrived</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm animate-pulse">Working</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-emerald-500/10 text-[#22C55E] border border-[#22C55E]/30">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-white/[0.04] text-slate-500 border border-white/[0.06]">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-[#070B14] text-slate-400 border border-white/[0.04]">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Header Card */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#FF7A00]" />
          My Service Bookings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Accept dispatches, manage active allocations, and track booking history.</p>
      </div>

      {/* Selector and Alert row */}
      <div className="flex flex-col gap-4">
        {/* Tabs Selector Row */}
        <div className="flex border border-white/[0.08] p-1 bg-[#0F172A]/60 backdrop-blur-md rounded-2xl select-none max-w-md">
          {(['new', 'active', 'cancelled'] as JobTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setActionError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/25 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'new' ? 'New dispatches' : tab === 'active' ? 'Active Jobs' : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Feedback Alert */}
        {actionError && (
          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold shadow max-w-md">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-550" />
            {actionError}
          </div>
        )}
      </div>

      {/* Grid List Rendering */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-505">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Syncing allocations...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl text-center text-xs text-red-400 font-bold shadow">
          Failed to fetch service listings.
        </div>
      ) : !data.jobs || data.jobs.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-16 text-center select-none space-y-3">
          <CalendarClock className="h-10 w-10 text-slate-650 mx-auto" />
          <h4 className="font-extrabold text-slate-300 text-sm">No bookings found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">There are currently no listings matching this status. New allocations will display here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.jobs.map((job: JobItem) => (
            <div 
              key={job.id} 
              className="bg-[#0F172A] border border-white/[0.08] hover:border-[#FF7A00]/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group min-h-[220px]"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white text-sm leading-snug group-hover:text-[#FF7A00] transition-colors">{job.service_name}</h3>
                    <p className="text-xs text-slate-450 font-medium">Client: {job.customer_first_name} • {job.locality}</p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(job.status)}</div>
                </div>

                {/* Specification Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#070B14]/60 p-3 rounded-2xl border border-white/[0.04] text-[11px] select-none">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-black text-slate-550 tracking-wider">Schedule</span>
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <Clock className="h-3.5 w-3.5 text-[#FF7A00] shrink-0" />
                      <span className="truncate">
                        {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-black text-slate-550 tracking-wider">Net Payout</span>
                    <div className="flex items-center gap-0.5 text-white font-black">
                      <IndianRupee className="h-3.5 w-3.5 text-[#FF7A00] shrink-0" />
                      <span>₹{job.estimated_earnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-black text-slate-550 tracking-wider">Distance</span>
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <Navigation className="h-3.5 w-3.5 text-[#FF7A00] shrink-0" />
                      <span>{job.distance_km !== undefined ? `${job.distance_km} km` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Action Row at bottom of card */}
              <div className="pt-4 select-none">
                {activeTab === 'new' ? (
                  <div className="flex gap-2.5 w-full">
                    {job.status === 'WORKER_ASSIGNED' && (
                      <button
                        type="button"
                        disabled={actioningId !== null}
                        onClick={() => handleRejectJob(job.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#070B14] hover:bg-[#070B14]/80 border border-white/[0.06] hover:border-red-500/30 text-slate-400 hover:text-red-400 py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actioningId !== null}
                      onClick={() => handleAcceptJob(job.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF9E43] text-white py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow shadow-orange-500/10 disabled:opacity-40"
                    >
                      {actioningId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Accept Job
                        </>
                      )}
                    </button>
                  </div>
                ) : activeTab === 'active' ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/worker/jobs/${job.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#070B14]/80 hover:bg-[#070B14] border border-white/[0.06] hover:border-[#FF7A00]/30 text-slate-350 hover:text-white py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer group"
                  >
                    Manage Active Trip
                    <ChevronRight className="h-4 w-4 text-[#FF7A00] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : null}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
