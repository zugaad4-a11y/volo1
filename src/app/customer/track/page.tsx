import React from 'react';
import { MapPin, Navigation, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerTrackPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 selection:bg-orange-500/30 selection:text-white">
      <div className="max-w-md w-full bg-[#0F172A] border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#FF7A00]/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-center">
            <Navigation className="h-7 w-7 text-[#FF7A00]" />
          </div>
          
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Live Tracking</h1>
            <p className="text-xs text-slate-400 mt-1.5 font-semibold leading-relaxed">
              Monitor your worker's real-time location, live ETA, and job status updates. Access this from an active booking.
            </p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <span className="px-2.5 py-1 text-[9px] rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] font-black uppercase tracking-wider border border-[#FF7A00]/20 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />GPS Enabled
            </span>
            <span className="px-2.5 py-1 text-[9px] rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] font-black uppercase tracking-wider border border-[#38BDF8]/20 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />Live ETA
            </span>
          </div>
          
          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/customer/bookings"
              className="inline-flex items-center gap-2 text-xs font-black text-[#FF7A00] hover:text-[#FF9E43] transition-colors uppercase tracking-wider"
            >
              View Active Bookings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
