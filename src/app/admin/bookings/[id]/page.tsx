'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import ConfirmModal from '@/components/admin/shared/ConfirmModal';
import { GitBranch, MapPin, Calendar } from 'lucide-react';

interface BookingDetail {
  id: string;
  status: string;
  booking_type: string;
  payment_mode: string;
  address_line: string;
  lat: number;
  lng: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_amount: number;
  notes: string | null;
  otp: string | null;
  created_at: string;
  service: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
  };
  customer: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  };
  worker: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  payment: any[];
  images?: string[];
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundToWallet, setRefundToWallet] = useState(false);

  // Reassignment Modal States
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [nearbyWorkers, setNearbyWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [fetchingWorkers, setFetchingWorkers] = useState(false);

  // Phase 9 Manual Assignment States
  const [queueStatus, setQueueStatus] = useState<string>('NOT_STARTED');
  const [history, setHistory] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingAssignDetails, setLoadingAssignDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedWorkerForOffer, setSelectedWorkerForOffer] = useState<any | null>(null);
  const [sendingOffer, setSendingOffer] = useState(false);

  async function fetchBooking() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      if (!res.ok) {
        router.push('/admin/bookings');
        return;
      }
      const data = await res.json();
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchManualAssignDetails() {
    if (!id) return;
    setLoadingAssignDetails(true);
    try {
      const res = await fetch(`/api/admin/manual-assign?bookingId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data.queueStatus);
        setHistory(data.history || []);
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error('Failed to load manual assign details:', err);
    } finally {
      setLoadingAssignDetails(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchBooking();
      fetchManualAssignDetails();
    }
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, refund_to_wallet: refundToWallet })
      });

      if (res.ok) {
        fetchBooking();
        setShowCancelModal(false);
        setCancelReason('');
        setRefundToWallet(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openReassignModal = async () => {
    if (!booking) return;
    setShowReassignModal(true);
    setFetchingWorkers(true);
    try {
      // Query nearby workers for this specific job location
      const res = await fetch(`/api/admin/manual-assignment?booking_id=${booking.id}`);
      const data = await res.json();
      setNearbyWorkers(data.available_workers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingWorkers(false);
    }
  };

  const handleReassignWorker = async () => {
    if (!booking || !selectedWorkerId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/manual-assignment/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          new_worker_id: selectedWorkerId
        })
      });

      if (res.ok) {
        fetchBooking();
        setShowReassignModal(false);
        setSelectedWorkerId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendManualOffer = async (workerId: string) => {
    if (!id || !workerId) return;
    setSendingOffer(true);
    try {
      const res = await fetch('/api/admin/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          workerId,
          notes
        })
      });

      if (res.ok) {
        alert('Direct manual offer dispatched successfully.');
        setNotes('');
        setSelectedWorkerForOffer(null);
        fetchManualAssignDetails();
        fetchBooking();
      } else {
        const err = await res.json();
        alert(err.error || 'Offer dispatch failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send offer.');
    } finally {
      setSendingOffer(false);
    }
  };

  if (loading || !booking) {
    return <LoadingSkeleton rows={6} cols={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Booking Details</h1>
          <p className="text-xs text-slate-500 font-mono">ID: {booking.id}</p>
        </div>
        <div className="flex gap-2">
          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
            <>
              <button
                type="button"
                onClick={openReassignModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors select-none"
              >
                Reassign Worker
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-450 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 rounded-lg transition-colors select-none"
              >
                Cancel Booking
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => router.push('/admin/bookings')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors select-none"
          >
            Back to list
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card - Booking Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-sm font-semibold text-white select-none">Order Status</span>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium select-none">Service Requested</span>
                <p className="font-semibold text-slate-200">{booking.service?.name}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium select-none">Booking Type / Schedule</span>
                <p className="font-semibold text-slate-200">
                  {booking.booking_type}
                  {booking.scheduled_at && ` (Scheduled for: ${new Date(booking.scheduled_at).toLocaleString()})`}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium select-none">Geographic Coordinates</span>
                <p className="font-mono text-xs text-slate-400">
                  Latitude: {booking.lat} <br />
                  Longitude: {booking.lng}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium select-none">Service Address</span>
                <p className="text-slate-200">{booking.address_line}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium select-none">Total Invoiced Amount</span>
                <p className="font-bold text-lg text-rose-400">₹{Number(booking.total_amount).toFixed(2)}</p>
              </div>

              {booking.otp && (
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-500 font-medium select-none">Verification OTP Code</span>
                  <p className="font-mono text-base font-bold text-slate-200">{booking.otp}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider select-none">Workflow Timestamps</span>
            <div className="grid grid-cols-3 gap-4 text-xs text-slate-450">
              <div>
                <span className="text-slate-500 block select-none">Created At</span>
                {new Date(booking.created_at).toLocaleString()}
              </div>
              <div>
                <span className="text-slate-500 block select-none">Started At</span>
                {booking.started_at ? new Date(booking.started_at).toLocaleString() : 'Not started'}
              </div>
              <div>
                <span className="text-slate-500 block select-none">Completed At</span>
                {booking.completed_at ? new Date(booking.completed_at).toLocaleString() : 'Not completed'}
              </div>
            </div>
          </div>
        </div>

        {/* Phase 9 Manual Assignment Section */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 select-none">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-rose-500" />
              Manual Assignment Management
            </h3>
            <span className="text-xs text-rose-450 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase">
              Queue Status: {queueStatus}
            </span>
          </div>

          {/* Verification candidate panel */}
          {booking.status === 'MANUAL_ASSIGNMENT_REQUIRED' || booking.status === 'PENDING_ASSIGNMENT' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ranked Workers Candidates</span>
                <p className="text-xs text-slate-400">The workers below are scored by distance (40%), rating (30%), completed jobs (20%), and acceptance rate (10%).</p>
              </div>

              {loadingAssignDetails ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <span className="h-6 w-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500">Ranking online workers...</span>
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <div key={c.workerId} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center text-xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-450 font-extrabold uppercase">
                            Score: {c.score}
                          </span>
                          {c.status !== 'ONLINE' && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-red-950/30 text-red-400 border border-red-900 rounded font-semibold">
                              {c.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-450 font-medium">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-550" />
                            {c.distance} km away
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-400">
                            ★ {c.rating.toFixed(1)}
                          </span>
                          <span>Jobs: {c.jobs}</span>
                          <span>Acceptance: {c.acceptanceRate}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedWorkerForOffer(c)}
                        disabled={sendingOffer}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold text-white transition-colors"
                      >
                        Assign Offer
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">No online workers available within search radius.</p>
              )}

              {/* Offer confirmation drawer */}
              {selectedWorkerForOffer && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-400">Send Direct Offer to: {selectedWorkerForOffer.name}</span>
                    <button onClick={() => setSelectedWorkerForOffer(null)} className="text-xs text-slate-450 hover:text-white">Cancel</button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Custom Admin Offer Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Preferred client request"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => handleSendManualOffer(selectedWorkerForOffer.workerId)}
                    disabled={sendingOffer}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-550 rounded-lg text-xs font-bold text-white transition-colors flex justify-center items-center gap-1"
                  >
                    {sendingOffer ? (
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Dispatch Direct Manual Offer'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-550 italic bg-slate-950/40 p-3 rounded-lg border border-slate-850">
              Direct dispatching is unavailable because booking is in status "{booking.status}".
            </p>
          )}

          {/* History offer list */}
          <div className="border-t border-slate-800/60 pt-4 space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Direct Assignment Offer Logs</span>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-200 block">{log.workerName}</span>
                      {log.notes && (
                        <p className="text-slate-400 italic">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase not-italic tracking-wider mb-0.5">Admin Dispatch Notes</span>
                          "{log.notes}"
                        </p>
                      )}
                      {log.status === 'REJECTED' && log.rejectionReason && (
                        <p className="text-rose-455/90 italic mt-1 bg-rose-950/10 p-2 rounded border border-rose-900/10">
                          <span className="text-[9px] text-rose-500/80 font-bold block uppercase not-italic tracking-wider mb-0.5">Rejection Reason</span>
                          "{log.rejectionReason}"
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 block pt-1">
                        Dispatched: {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      log.status === 'ACCEPTED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      log.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      log.status === 'EXPIRED' ? 'bg-slate-800 text-slate-450 border-slate-700' :
                      log.status === 'REASSIGNED' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No manual assignment offers have been created for this booking request.</p>
            )}
          </div>
        </div>

        {/* Right Side - Customer and Worker cards */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 select-none">Customer Profile</h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-slate-200">{booking.customer.full_name || 'Customer Profile incomplete'}</p>
              <p className="text-xs text-slate-500">{booking.customer.phone}</p>
              <p className="text-xs text-slate-500">{booking.customer.email || 'No email registered'}</p>
            </div>
          </div>

          {/* Worker Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 select-none">Assigned Worker</h3>
            {booking.worker ? (
              <div className="text-sm space-y-1">
                <p className="font-bold text-slate-200">{booking.worker.full_name}</p>
                <p className="text-xs text-slate-500">{booking.worker.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No worker assigned to this service booking.</p>
            )}
          </div>

          {/* Service Completion Images Card */}
          {booking.images && booking.images.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 select-none">Completion Proof</h3>
              <div className="grid grid-cols-2 gap-2">
                {booking.images.map((url, i) => (
                  <div key={i} className="border border-slate-800 bg-slate-950 rounded-lg h-24 overflow-hidden relative group">
                    <img 
                      src={url} 
                      alt={`Work Completion Proof ${i + 1}`} 
                      className="object-contain h-full w-full"
                    />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition-opacity cursor-pointer"
                    >
                      Open Original
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        onConfirm={handleCancelBooking}
        title="Cancel Booking Request"
        message="Please input the cancellation explanation below to notify the customer and worker:"
        confirmText="Cancel Booking"
        isLoading={actionLoading}
      />

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Cancel Booking</h3>
              <p className="text-xs text-slate-500">This will cancel the booking and notify the customer and assigned worker.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Cancellation Reason</label>
              <input
                type="text"
                placeholder="e.g. No workers available, customer requested"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {booking && Number(booking.total_amount) > 0 && (
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  checked={refundToWallet}
                  onChange={(e) => setRefundToWallet(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-white">Refund ₹{Number(booking.total_amount).toFixed(0)} to wallet</p>
                  <p className="text-[10px] text-slate-500">Credit the booking amount back to customer wallet</p>
                </div>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); setCancelReason(''); setRefundToWallet(false); }}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading && <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Manual Worker Reassignment</h3>
              <p className="text-xs text-slate-500">Select a new worker from the list of nearest active online workers:</p>
            </div>

            {fetchingWorkers ? (
              <div className="py-12 flex justify-center">
                <span className="h-6 w-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : nearbyWorkers.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/40 text-xs">
                {nearbyWorkers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkerId(w.id)}
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                      selectedWorkerId === w.id ? 'bg-violet-600/10 text-violet-400' : 'hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{w.name}</p>
                      <p className="text-[10px] text-slate-500">★ {w.rating.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold">{w.distance_km} km away</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No online approved workers available within radius.</p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedWorkerId('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignWorker}
                disabled={actionLoading || !selectedWorkerId}
                className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {actionLoading && (
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Reassign Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
