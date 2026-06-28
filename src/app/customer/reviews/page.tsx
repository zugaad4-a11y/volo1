'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Star, MessageSquare, Loader2, AlertCircle, 
  CheckCircle2, Plus, Calendar, X, Save 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ReviewItem {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
  bookings: {
    service_items: {
      name: string;
    };
  };
  workers: {
    users: {
      full_name: string;
    };
  };
}

export default function CustomerReviewsPage() {
  // Fetch reviews and history
  const { data: revData, error: revErr, isLoading: revLoading } = useSWR('/api/customer/reviews', fetcher);
  const { data: histData, isLoading: histLoading } = useSWR('/api/customer/booking-history', fetcher);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenReview = (bookingId: string, serviceName: string) => {
    setSelectedBookingId(bookingId);
    setSelectedServiceName(serviceName);
    setRating(5);
    setComment('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedBookingId || rating < 1 || rating > 5) {
      setErrorMsg('Invalid review data.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBookingId,
          rating,
          comment
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit review.');
      }

      setSuccessMsg('Thank you! Your feedback has been recorded.');
      mutate('/api/customer/reviews');
      mutate('/api/customer/booking-history');
      setTimeout(() => setShowModal(false), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = revLoading || histLoading;

  // Filter out completed bookings that don't have reviews yet
  const reviewedBookingIds = revData?.reviews?.map((r: ReviewItem) => r.booking_id) || [];
  const pendingReviews = histData?.bookings?.filter((b: any) => 
    b.status === 'COMPLETED' && !reviewedBookingIds.includes(b.id)
  ) || [];

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Title Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden select-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-rose-500/5 blur-3xl rounded-full" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Ratings & Reviews</h2>
        <p className="text-xs text-slate-550">Share your experiences and grade technician services.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-7 w-7 text-rose-600 animate-spin mx-auto mb-2.5" />
          <p className="text-xs">Fetching feedback records...</p>
        </div>
      ) : revErr ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center text-xs text-red-500">
          Failed to load review details.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Pending Reviews list */}
          {pendingReviews.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">Awaiting Your Feedback</h3>
              
              <div className="space-y-3">
                {pendingReviews.map((b: any) => (
                  <div 
                    key={b.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{b.service_items?.name || 'Service Call'}</h4>
                      <span className="text-[9px] text-slate-450 block font-semibold">
                        Completed: {new Date(b.completed_at || b.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReview(b.id, b.service_items?.name || 'Service Call')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer"
                    >
                      Rate Job
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Reviews Grid */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">My Submitted Reviews</h3>

            {revData?.reviews?.length > 0 ? (
              <div className="space-y-4 divide-y divide-slate-100">
                {revData.reviews.map((r: ReviewItem, idx: number) => (
                  <div key={r.id} className={`space-y-2.5 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-slate-800">{r.bookings?.service_items?.name || 'Service Call'}</h4>
                        <span className="text-[9px] text-slate-450 font-medium block">
                          Technician: {r.workers?.users?.full_name || 'Volo Specialist'}
                        </span>
                      </div>
                      
                      {/* Render stars */}
                      <div className="flex items-center gap-0.5 shrink-0 select-none">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {r.comment && (
                      <p className="text-[10px] text-slate-600 font-medium italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed select-all">
                        "{r.comment}"
                      </p>
                    )}

                    <span className="text-[8px] text-slate-400 font-mono block select-none">
                      Submitted: {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-450 italic font-semibold text-center py-6 select-none">You haven't submitted any reviews yet.</p>
            )}
          </div>

        </div>
      )}

      {/* Review Submission Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center select-none">
              <h3 className="font-bold text-slate-800 text-sm">Write Review</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Rate your service request for <span className="font-bold text-slate-800">{selectedServiceName}</span>:
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Clickable Rating Stars */}
              <div className="flex justify-center gap-1.5 py-1 select-none">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starVal = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star 
                        className={`h-7 w-7 ${
                          starVal <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Comment field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Comment Description (Max 500 chars)</label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 font-semibold outline-none transition-all resize-none leading-relaxed"
                  placeholder="Share details of the technician's speed, cleanup, or behavior..."
                />
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <p className="p-2.5 bg-red-50 border border-red-100 text-red-650 text-[10px] font-bold text-center rounded-lg flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-650 text-[10px] font-bold text-center rounded-lg flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-550 text-white py-3 px-6 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Submit Review
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
