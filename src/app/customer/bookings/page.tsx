'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Briefcase, Loader2, AlertCircle, Sparkles, 
  ArrowRight, Clock, Plus, ChevronRight 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/customer/bookings', fetcher);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-orange-500/10 text-[#FF7A00] border border-[#FF7A00]/25 font-mono">Pending Assignment</span>;
      case 'WORKER_ASSIGNED':
      case 'WORKER_ACCEPTED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-blue-500/10 text-[#38BDF8] border border-blue-500/25 font-mono">Technician Assigned</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono animate-pulse">En Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono animate-pulse">Arrived</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/25 font-mono">In Progress</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-white/5 text-slate-400 border border-white/[0.08] font-mono">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="flex justify-between items-center gap-4 relative z-10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#FF7A00]" />
              Active Bookings
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Track ongoing, arrived, and scheduled home repairs in real-time.</p>
          </div>
          
          <button
            onClick={() => router.push('/customer/services')}
            className="inline-flex items-center gap-1.5 bg-[#FF7A00] hover:bg-orange-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-black uppercase transition-all tracking-wider select-none cursor-pointer shadow-lg shadow-orange-500/10 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Book Service
          </button>
        </div>
      </div>

      {/* Bookings List view */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-405">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider font-mono">Loading active journeys...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center text-xs text-red-400 font-bold font-mono">
          Failed to load active bookings.
        </div>
      ) : !data.bookings || data.bookings.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-10 text-center select-none space-y-4 hover-scale duration-300 shadow-xl shadow-[#070B14]/40">
          <Briefcase className="h-10 w-10 text-slate-500 mx-auto" />
          <h4 className="font-display font-black text-white text-sm">No Active Journeys</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">You do not have any active or scheduled bookings running at the moment.</p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/customer/services')}
              className="inline-flex items-center gap-2 bg-[#070B14] hover:bg-white/[0.03] border border-white/[0.08] text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono"
            >
              Explore Services
              <ArrowRight className="h-4 w-4 text-[#FF7A00]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {data.bookings.map((booking: any) => (
            <div
              key={booking.id}
              onClick={() => router.push(`/customer/bookings/${booking.id}`)}
              className="bg-[#0F172A] border border-white/[0.08] hover:border-[#FF7A00]/40 rounded-3xl p-5 shadow-xl shadow-[#070B14]/40 cursor-pointer transition-all group hover-scale duration-300 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-[#070B14] text-slate-400 border border-white/[0.06] font-mono">
                      {booking.booking_type}
                    </span>
                    <h3 className="font-display font-bold text-sm text-white truncate leading-snug group-hover:text-[#FF7A00] transition-colors">
                      {booking.service_items?.name || 'Service Call'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-1">{booking.address_line}</p>
                  </div>
                  
                  <div className="shrink-0">
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.06] text-[10px] text-slate-400 font-semibold select-none font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                  {booking.scheduled_at 
                    ? new Date(booking.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Instant (Asap)'}
                </span>

                <span className="flex items-center gap-0.5 text-[#FF7A00] group-hover:translate-x-0.5 transition-transform duration-200 font-bold">
                  Track
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
