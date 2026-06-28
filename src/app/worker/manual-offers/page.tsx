'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, MapPin, MessageSquare, Clock, Check, X, 
  AlertCircle, Loader2, RefreshCw, IndianRupee
} from 'lucide-react';

interface ManualOffer {
  id: string;
  status: string;
  notes: string | null;
  expiresAt: string;
  createdAt: string;
  bookingId: string;
  serviceName: string;
  addressLine: string;
  scheduledAt: string;
  distanceKm: number;
  estimatedEarnings: number;
}

function OfferCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(Math.floor((+new Date(expiresAt) - Date.now()) / 1000), 0);
    setTimeLeft(calc());
    const timer = setInterval(() => {
      const left = calc();
      setTimeLeft(left);
      if (left <= 0) { clearInterval(timer); onExpire(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (timeLeft <= 0) return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-rose-400 text-xs font-black">
      <Clock className="h-3.5 w-3.5" />Expired
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black font-mono border ${
      timeLeft < 60 
        ? 'bg-red-500/10 border-red-500/20 text-rose-400' 
        : 'bg-amber-500/10 border-amber-500/20 text-[#F59E0B]'
    }`}>
      <Clock className="h-3.5 w-3.5 animate-pulse" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} left
    </span>
  );
}

export default function WorkerManualOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<ManualOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<ManualOffer | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function fetchOffers(quiet = false) {
    try {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      const res = await fetch('/api/worker/manual-offers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchOffers(); }, []);

  const handleAccept = async (offer: ManualOffer) => {
    setAcceptingId(offer.id);
    try {
      const res = await fetch(`/api/worker/manual-offers/${offer.id}/accept`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Acceptance failed');
      }
      router.push('/worker/jobs');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setRejectingId(rejectModal.id);
    try {
      const res = await fetch(`/api/worker/manual-offers/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Rejection failed');
      }
      setRejectModal(null);
      setRejectReason('');
      fetchOffers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#FF7A00]" />
              Direct Job Offers
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Review personally dispatched offers from admin — accept before the timer runs out.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchOffers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#070B14]/60 border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Offers Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Loading direct offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-14 text-center select-none space-y-3">
          <Briefcase className="h-10 w-10 text-slate-700 mx-auto" />
          <h4 className="font-black text-slate-300 text-sm">No Direct Offers</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-semibold">You have no pending manual job assignments at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const isExpired = offer.status === 'EXPIRED' || +new Date(offer.expiresAt) <= Date.now();
            return (
              <div
                key={offer.id}
                className={`bg-[#0F172A] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
                  isExpired ? 'border-white/[0.04] opacity-60' : 'border-[#FF7A00]/25 hover:border-[#FF7A00]/40'
                }`}
              >
                {/* Top accent stripe */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${isExpired ? 'bg-slate-700' : 'bg-gradient-to-r from-[#FF7A00] to-amber-400'}`} />

                <div className="space-y-5">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#FF7A00] uppercase tracking-widest block">Direct Dispatch</span>
                      <h3 className="text-base font-extrabold text-white leading-tight">{offer.serviceName}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <OfferCountdown expiresAt={offer.expiresAt} onExpire={() => fetchOffers(true)} />
                      <div className="flex items-center gap-0.5 text-base font-black text-[#FF7A00]">
                        <IndianRupee className="h-4 w-4 shrink-0" />
                        {offer.estimatedEarnings.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 bg-[#070B14]/60 border border-white/[0.04] p-4 rounded-2xl text-xs">
                    <MapPin className="h-4.5 w-4.5 text-[#FF7A00] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-white">Service Location ({offer.distanceKm} km away)</p>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{offer.addressLine}</p>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {offer.notes && (
                    <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl text-xs text-amber-400">
                      <MessageSquare className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span className="block font-black text-amber-400 text-[9px] uppercase tracking-wider mb-1">Admin Instructions</span>
                        <p className="leading-relaxed italic">"{offer.notes}"</p>
                      </div>
                    </div>
                  )}

                  {/* CTA Row */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRejectModal(offer)}
                      disabled={isExpired || !!acceptingId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#070B14] hover:bg-[#070B14]/80 border border-white/[0.06] hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(offer)}
                      disabled={isExpired || !!acceptingId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#FF7A00] hover:bg-[#FF9E43] text-white rounded-xl text-xs font-black uppercase shadow shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {acceptingId === offer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Check className="h-3.5 w-3.5" />Accept & Dispatch</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2 select-none">
                <AlertCircle className="h-5 w-5 text-[#EF4444]" />
                Decline Direct Offer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Provide a reason for declining so the admin can reassign the job.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Rejection Reason</label>
              <input
                type="text"
                placeholder="e.g. Too far away / Vehicle issue"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-white outline-none transition-all font-semibold"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 bg-[#070B14]/60 border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!rejectingId || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-[#EF4444] hover:bg-red-500 disabled:opacity-40 text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                {rejectingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline Job'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
