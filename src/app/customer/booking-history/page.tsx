'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  History, Loader2, AlertCircle, Clock, 
  CheckCircle2, XCircle, ChevronRight, ArrowRight 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CustomerBookingHistoryPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/customer/booking-history', fetcher);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Title Header */}
      <div className="glass-card-light rounded-3xl p-6 shadow-md relative overflow-hidden select-none hover-scale">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-rose-500/10 blur-3xl rounded-full" />
        <h2 className="font-display text-xl font-black tracking-tight text-slate-900">Booking History</h2>
        <p className="text-xs text-slate-550">View records of your completed repairs and cancelled sessions.</p>
      </div>

      {/* Main History Feed */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-7 w-7 text-rose-600 animate-spin mx-auto mb-2.5" />
          <p className="text-xs">Fetching past records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center text-xs text-red-500">
          Failed to load booking history records.
        </div>
      ) : !data.bookings || data.bookings.length === 0 ? (
        <div className="glass-card-light rounded-3xl p-10 text-center select-none space-y-3.5 hover-scale">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-sm">
            <History className="h-6 w-6 text-rose-600 animate-pulse-slow" />
          </div>
          <h4 className="font-display font-extrabold text-slate-800 text-sm">No History Records</h4>
          <p className="text-xs text-slate-455 max-w-xs mx-auto leading-relaxed font-medium">You do not have any finished or cancelled service requests in your account.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          {data.bookings.map((booking: any) => (
            <div
              key={booking.id}
              onClick={() => router.push(`/customer/bookings/${booking.id}`)}
              className="glass-card-light rounded-3xl p-5 shadow-md space-y-4 cursor-pointer hover-scale hover:border-rose-350 hover:glow-rose transition-all duration-300 group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded border ${
                    booking.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-650 border-emerald-100'
                      : 'bg-red-50 text-red-650 border-red-100'
                  }`}>
                    {booking.status}
                  </span>
                  <h3 className="font-display font-bold text-sm text-slate-800 leading-snug group-hover:text-rose-600 transition-colors">
                    {booking.service_items?.name || 'Service Call'}
                  </h3>
                  <p className="text-[10px] text-slate-455 font-semibold line-clamp-1">{booking.address_line}</p>
                </div>
                
                <span className="text-xs font-black text-slate-850 shrink-0">
                  {formatCurrency(Number(booking.total_amount))}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-450 font-semibold select-none">
                <span className="flex items-center gap-1.5">
                  {booking.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-650" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  Completed: {booking.completed_at 
                    ? new Date(booking.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(booking.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                <span className="flex items-center gap-0.5 text-rose-600 group-hover:translate-x-0.5 transition-all">
                  View Details
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
