'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import EmptyState from '@/components/admin/shared/EmptyState';
import { 
  ClipboardList, 
  MapPin, 
  Calendar, 
  User, 
  Star, 
  HardHat, 
  Phone, 
  RefreshCw, 
  History, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Clock,
  ChevronRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface ManualBooking {
  id: string;
  created_at: string;
  address_line: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  category_name: string;
  status: string;
  attempts: number;
  waiting_mins: number;
}

interface RankedWorker {
  workerId: string;
  name: string;
  phone: string;
  score: number;
  distance: number;
  rating: number;
  jobs: number;
  acceptanceRate: number;
  status: string;
  kycStatus: string;
}

interface OfferHistoryItem {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  status: string;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ManualAssignmentsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<ManualBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Metrics & Expired state
  const [metrics, setMetrics] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    reassigned: 0,
    successRate: 0,
    averageResponseTimeMins: 0
  });
  const [expiredOffers, setExpiredOffers] = useState<any[]>([]);

  // Active item selection
  const [selectedBooking, setSelectedBooking] = useState<ManualBooking | null>(null);
  const [candidates, setCandidates] = useState<RankedWorker[]>([]);
  const [history, setHistory] = useState<OfferHistoryItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Dispatch parameters
  const [selectedWorker, setSelectedWorker] = useState<RankedWorker | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  async function fetchDashboardStats() {
    try {
      const res = await fetch('/api/admin/manual-assign');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setExpiredOffers(data.expiredOffers || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard statistics:', err);
    }
  }

  async function fetchManualBookings(quiet = false) {
    try {
      if (!quiet) setLoading(true);
      else setRefreshing(true);

      const res = await fetch('/api/admin/queued-bookings?limit=100');
      if (!res.ok) throw new Error('Failed to fetch unassigned bookings');
      const data = await res.json();
      
      const filtered = (data.bookings || []).map((b: any) => ({
        id: b.id,
        created_at: b.created_at,
        address_line: b.address_line,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        service_name: b.service_name,
        category_name: b.category_name,
        status: b.status || 'MANUAL_ASSIGNMENT_REQUIRED',
        attempts: b.attempts || 0,
        waiting_mins: b.waiting_mins || 0
      }));

      setBookings(filtered);
      
      // Auto select the first booking if none selected
      if (filtered.length > 0 && !selectedBooking) {
        handleSelectBooking(filtered[0]);
      } else if (filtered.length === 0) {
        setSelectedBooking(null);
        setCandidates([]);
        setHistory([]);
      }

      await fetchDashboardStats();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchManualBookings();
  }, []);

  const handleSelectBooking = async (booking: ManualBooking) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);
    setCandidates([]);
    setSelectedWorker(null);
    setAdminNotes('');

    try {
      const res = await fetch(`/api/admin/manual-assign?bookingId=${booking.id}`);
      if (!res.ok) throw new Error('Failed to load manual assignment details');
      const data = await res.json();
      setCandidates(data.candidates || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDispatchOffer = async () => {
    if (!selectedBooking || !selectedWorker) return;
    setDispatching(true);

    try {
      const res = await fetch('/api/admin/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          workerId: selectedWorker.workerId,
          notes: adminNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Dispatch offer failed');
      }

      alert(`Manual Offer sent to ${selectedWorker.name}.`);
      setSelectedWorker(null);
      setAdminNotes('');
      await fetchManualBookings(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error sending offer.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-5 no-print">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#FF8A00]" />
            Dispatch Command Center
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Review unassigned bookings, verify auto-dispatch routes, and manually dispatch direct technician offers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchManualBookings(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-[#111827] border border-[#1F2937] hover:bg-[#172033] hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Sync Queue'}
        </button>
      </div>

      {/* Dispatch Statistics Header Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 select-none no-print">
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total Offers</span>
          <span className="text-lg font-black font-mono text-slate-200">{metrics.total}</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-[#22C55E] font-bold uppercase tracking-wider block font-mono">Accepted</span>
          <span className="text-lg font-black font-mono text-[#22C55E]">{metrics.accepted}</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-[#EF4444] font-bold uppercase tracking-wider block font-mono">Rejected</span>
          <span className="text-lg font-black font-mono text-[#EF4444]">{metrics.rejected}</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-[#F59E0B] font-bold uppercase tracking-wider block font-mono">Expired</span>
          <span className="text-lg font-black font-mono text-[#F59E0B]">{metrics.expired}</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-[#3B82F6] font-bold uppercase tracking-wider block font-mono">Reassigned</span>
          <span className="text-lg font-black font-mono text-[#3B82F6]">{metrics.reassigned}</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-rose-450 font-bold uppercase tracking-wider block font-mono">Success Rate</span>
          <span className="text-lg font-black font-mono text-rose-400">{metrics.successRate}%</span>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Response Time</span>
          <span className="text-lg font-black font-mono text-slate-200">{metrics.averageResponseTimeMins}m</span>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={3} />
      ) : bookings.length > 0 ? (
        /* MAIN 3-COLUMN DISPATCH GRID LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: PENDING MANUAL DISPATCH LIST */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Unassigned Queue ({bookings.length})</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {bookings.map((booking) => {
                const isSelected = selectedBooking?.id === booking.id;
                return (
                  <div
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className={`p-4.5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                      isSelected 
                        ? 'bg-[#FF8A00]/5 border-[#FF8A00] shadow-md shadow-orange-950/10'
                        : 'bg-[#111827] border-[#1F2937] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold">
                      <span>{booking.id.slice(0, 8).toUpperCase()}</span>
                      <span className="flex items-center gap-1 text-[#F59E0B]">
                        <Clock className="h-3 w-3 animate-pulse" />
                        {booking.waiting_mins}m ago
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight uppercase font-mono">{booking.service_name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-normal">Client: {booking.customer_name}</p>
                    </div>
                    <div className="flex items-start gap-1 text-[10px] text-slate-500 leading-relaxed max-w-xs">
                      <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">{booking.address_line}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: SELECTED BOOKING DETAILS & DISPATCH CONFIG */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Assignment Control</h3>
            
            {selectedBooking ? (
              <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5.5 space-y-6 shadow-xl">
                
                {/* Info summary */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start border-b border-[#1F2937] pb-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase font-mono">Active Target</h4>
                      <span className="font-mono text-[10px] font-bold text-slate-500">ID: {selectedBooking.id.toUpperCase()}</span>
                    </div>
                    <Link href={`/admin/bookings/${selectedBooking.id}`} className="p-1 hover:bg-[#172033] rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/35">
                      <span className="text-slate-450 font-semibold">Service</span>
                      <span className="font-bold text-[#FF8A00] uppercase font-mono">{selectedBooking.service_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/35">
                      <span className="text-slate-450 font-semibold">Customer</span>
                      <span className="font-bold text-white">{selectedBooking.customer_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/35">
                      <span className="text-slate-450 font-semibold">Contact</span>
                      <span className="font-mono text-slate-200 font-semibold">{selectedBooking.customer_phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/35">
                      <span className="text-slate-450 font-semibold">Waiting Time</span>
                      <span className="font-mono text-amber-400 font-bold">{selectedBooking.waiting_mins} minutes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-450 font-semibold">Previous Attempts</span>
                      <span className="font-mono text-red-400 font-bold">{selectedBooking.attempts}</span>
                    </div>
                  </div>
                </div>

                {/* Form dispatch parameters */}
                {selectedWorker ? (
                  <div className="p-4 bg-[#0A0F1E] border border-[#FF8A00]/25 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#FF8A00] font-mono">Target Recipient</span>
                      <button type="button" onClick={() => setSelectedWorker(null)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase font-mono cursor-pointer">Change</button>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-xs">{selectedWorker.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Score: {selectedWorker.score} • Distance: {selectedWorker.distance} km</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block font-mono">Custom Admin Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Technician matches requested slot."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] focus:border-[#FF8A00]/50 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDispatchOffer}
                      disabled={dispatching}
                      className="w-full py-3 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-orange-950/20 active:scale-95 cursor-pointer"
                    >
                      {dispatching ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send Manual Offer
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[#1F2937] rounded-2xl bg-[#0A0F1E]/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Select candidate worker from the list to prepare dispatch offer.
                  </div>
                )}

                {/* Offer history timeline preview */}
                <div className="space-y-3 border-t border-[#1F2937] pt-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] font-mono">Offer History Logs</h5>
                  {history.length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar text-[11px]">
                      {history.map(log => (
                        <div key={log.id} className="p-2.5 rounded-xl border border-[#1F2937] bg-[#0A0F1E] space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white truncate max-w-[120px]">{log.workerName}</span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                              log.status === 'ACCEPTED' ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' :
                              log.status === 'REJECTED' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' :
                              'bg-slate-900 border-[#1F2937] text-slate-400'
                            }`}>{log.status}</span>
                          </div>
                          <span className="block text-[9px] text-slate-500 font-mono">Sent: {new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-wider py-4">No previous dispatch offers sent.</div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-[#111827]/40 border border-dashed border-[#1F2937] rounded-3xl p-10 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                Select a pending booking to assign.
              </div>
            )}
          </div>

          {/* COLUMN 3: CANDIDATE WORKERS LIST & RECOMMENDATIONS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Ranked Candidates</h3>
            
            {selectedBooking ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
                {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 text-[#FF8A00] animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Ranking closest workers...</span>
                  </div>
                ) : candidates.length > 0 ? (
                  candidates.map((worker, index) => {
                    const isSelected = selectedWorker?.workerId === worker.workerId;
                    const isRecommended = index === 0;
                    return (
                      <div
                        key={worker.workerId}
                        onClick={() => setSelectedWorker(worker)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                          isSelected 
                            ? 'bg-[#FF8A00]/5 border-[#FF8A00] shadow shadow-orange-950/15'
                            : 'bg-[#111827] border-[#1F2937] hover:border-slate-700'
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute right-0 top-0 bg-gradient-to-l from-[#FF8A00] to-[#FF9F2E] text-white px-2 py-0.5 rounded-bl-xl text-[8px] font-black uppercase tracking-wider font-mono">
                            Best Pick
                          </div>
                        )}
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-white">{worker.name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {worker.distance} km
                            </span>
                            <span className="flex items-center gap-0.5 text-amber-400">
                              ★ {worker.rating.toFixed(1)}
                            </span>
                            <span>Jobs: {worker.jobs}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-[#1F2937]/50 pt-2 text-slate-500 font-bold font-mono">
                          <span>SCORE: {worker.score}</span>
                          <span className={worker.status === 'ONLINE' ? 'text-[#22C55E]' : 'text-slate-500'}>{worker.status}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center border border-dashed border-[#1F2937] rounded-3xl bg-[#0A0F1E]/15 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    No matching online partners found.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#111827]/40 border border-dashed border-[#1F2937] rounded-3xl p-10 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                Select booking to load candidates.
              </div>
            )}
          </div>

        </div>
      ) : (
        <EmptyState
          title="All Bookings Handled!"
          message="No customer bookings are currently flagged as manual assignment required."
        />
      )}

      {/* Expired Offers History Log Section at bottom */}
      <div className="space-y-4 pt-6 border-t border-[#1F2937] no-print">
        <div className="space-y-1 px-1">
          <h2 className="text-sm font-black tracking-tight text-amber-500 uppercase font-mono flex items-center gap-2 select-none">
            <Clock className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            Expired Dispatch Offers Logs
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Logs of manual assignment offers that expired without technician acceptance.
          </p>
        </div>

        {expiredOffers.length > 0 ? (
          <div className="w-full overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left text-sm text-slate-350">
                <thead className="bg-[#0A0F1E] text-slate-400 border-b border-[#1F2937] text-[10px] font-black uppercase tracking-widest font-mono select-none">
                  <tr>
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Technician Name</th>
                    <th className="px-6 py-4">Dispatched By</th>
                    <th className="px-6 py-4">Expired At</th>
                    <th className="px-6 py-4">Offer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50">
                  {expiredOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-[#172033]/60 transition-colors border-b border-[#1F2937]/35 last:border-b-0">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold select-all">
                        {offer.bookingId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-white text-xs">{offer.workerName}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-350">
                        {offer.assignedByName}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#EF4444] font-mono font-bold">
                        {new Date(offer.expiredAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={offer.notes || ''}>
                        {offer.notes || <span className="text-slate-600 italic">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic bg-[#111827]/10 p-6 border border-dashed border-[#1F2937] rounded-2xl text-center font-bold uppercase tracking-wider">
            No expired dispatch offers recorded.
          </p>
        )}
      </div>

    </div>
  );
}
