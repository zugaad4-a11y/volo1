'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { 
  User, Phone, MapPin, Clock, Info, ShieldCheck, 
  ArrowLeft, Loader2, Play, CheckCircle2, ChevronRight, 
  IndianRupee, Lock, Eye, EyeOff, AlertCircle, Camera, X, Navigation
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase-client';
import { compressKycImage } from '@/lib/image-compression';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorkerJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, error, isLoading } = useSWR(jobId ? `/api/worker/jobs/${jobId}` : null, fetcher);

  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OTP inputs
  const [otpValue, setOtpValue] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Update status (Start Journey / Mark Arrived / Complete)
  const handleUpdateStatus = async (nextStatus: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED') => {
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let imageUrl = null;

      if (nextStatus === 'COMPLETED') {
        if (!proofImage) {
          throw new Error('Please upload a photo of the completed work for verification.');
        }

        setUploadingImage(true);
        // Compress image
        const compressedFile = await compressKycImage(proofImage, 'WORK_PROOF');
        
        // Upload to Supabase storage
        const fileName = `job_${jobId}_completion_${Date.now()}.webp`;
        const uploadPath = `worker_${job.worker_id || 'verification'}/${fileName}`;
        
        const { data: uploadData, error: uploadErr } = await supabaseClient.storage
          .from('booking-images')
          .upload(uploadPath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadErr) {
          setUploadingImage(false);
          throw new Error(`Failed to upload verification image: ${uploadErr.message}`);
        }
        
        imageUrl = uploadData.path;
        setUploadingImage(false);
      }

      const res = await fetch(`/api/worker/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, imageUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }
      
      setSuccessMsg(`Status updated to ${nextStatus.replace(/_/g, ' ')}.`);
      mutate(`/api/worker/jobs/${jobId}`);
      mutate('/api/worker/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating service status.');
      setUploadingImage(false);
    } finally {
      setUpdating(false);
    }
  };

  // Submit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 4) {
      setOtpError('Please enter a valid 4-digit OTP.');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed.');
      }
      
      setSuccessMsg('OTP verified! Work is now started.');
      setOtpValue('');
      mutate(`/api/worker/jobs/${jobId}`);
      mutate('/api/worker/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
        <p className="text-xs text-slate-500 mt-2">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-12">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-white">Failed to load Job details</h3>
        <p className="text-xs text-slate-400">There was a problem retrieving the active booking details. Please try refreshing.</p>
        <button
          type="button"
          onClick={() => mutate(`/api/worker/jobs/${jobId}`)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Action flow buttons logic
  const renderCTAButton = () => {
    switch (job.status) {
      case 'WORKER_ACCEPTED':
        return (
          <button
            type="button"
            onClick={() => handleUpdateStatus('ON_THE_WAY')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3.5 px-6 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start Journey (On the way)
          </button>
        );
      case 'ON_THE_WAY':
        return (
          <button
            type="button"
            onClick={() => handleUpdateStatus('ARRIVED')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3.5 px-6 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Mark Arrived at Client Place
          </button>
        );
      case 'ARRIVED':
        return (
          <div className="bg-slate-950/40 border border-slate-850/60 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-450 text-xs font-bold uppercase select-none">
              <Lock className="h-4 w-4" />
              OTP verification required
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">Ask the client for the 4-digit service startup OTP code to unlock and start working.</p>
            
            <form onSubmit={handleVerifyOtp} className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                pattern="\d*"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit code"
                disabled={verifyingOtp}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-rose-500/50 rounded-xl px-4 py-2.5 text-xs text-center font-extrabold tracking-widest text-slate-100 placeholder-slate-650 outline-none transition-all disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={verifyingOtp || otpValue.length < 4}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-40"
              >
                {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </button>
            </form>
            {otpError && (
              <p className="text-[10px] text-red-400 font-bold bg-red-500/5 px-3 py-1 border border-red-500/10 rounded-lg">
                {otpError}
              </p>
            )}
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl">
            <h4 className="text-xs font-bold text-slate-200">Capture / Upload Work Verification</h4>
            <p className="text-[11px] text-slate-400">Please take a clear photo of the completed work or upload an image from your device to close the job.</p>
            
            {!proofImage ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 border-dashed text-slate-300 py-8 px-6 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none"
                >
                  <Camera className="h-6 w-6 text-emerald-500 mb-1" />
                  <span>Take Photo / Choose Image</span>
                  <span className="text-[10px] text-slate-500 font-normal">Supports camera capture and gallery uploads on all devices</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProofImage(file);
                  }}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-xl flex items-center justify-between border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 truncate flex-1 font-mono">{proofImage.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setProofImage(null)}
                    disabled={updating || uploadingImage}
                    className="text-slate-500 hover:text-red-400 p-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={updating || uploadingImage}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-6 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50"
                >
                  {(updating || uploadingImage) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {uploadingImage ? 'Uploading Image...' : 'Complete Job Work'}
                </button>
              </div>
            )}
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl text-center space-y-3 select-none">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-200 text-sm">Job Completed Successfully!</h4>
            <p className="text-xs text-slate-450">Earning payouts will settle into your partner wallet ledger shortly.</p>
            <button
              type="button"
              onClick={() => router.push('/worker/jobs')}
              className="inline-flex items-center gap-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              Back to Bookings
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => router.push('/worker/jobs')}
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors cursor-pointer select-none"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </button>

      {/* Main Details Card */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Header Block */}
        <div className="flex justify-between items-start border-b border-slate-800/60 pb-5">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Active Journey Booking</span>
            <h2 className="text-base font-bold text-white leading-tight">{job.service?.name || 'Home Service'}</h2>
            <p className="text-[10px] font-mono text-slate-550">ID: {job.id}</p>
          </div>
          <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded bg-rose-500/10 text-rose-450 border border-rose-500/20">
            {job.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Action Button CTA Box */}
        <div className="space-y-3">
          {renderCTAButton()}
          
          {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-550" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {successMsg}
            </div>
          )}
        </div>

        {/* Client details summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest px-1">Customer & Contact details</h3>
          
          <div className="bg-slate-950/40 border border-slate-850/60 rounded-3xl p-4 space-y-3 text-xs select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="text-slate-300 font-semibold">{job.customer?.full_name || 'Client name'}</span>
              </div>
              
              {job.customer?.phone && (
                <a
                  href={`tel:${job.customer.phone}`}
                  className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-750 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-rose-450 uppercase transition-all select-none hover:scale-105"
                >
                  <Phone className="h-3 w-3" />
                  Call Client
                </a>
              )}
            </div>

            <div className="flex items-start gap-2.5 border-t border-slate-850/60 pt-3 text-[11px] leading-relaxed text-slate-400">
              <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300">Service Location Address</p>
                <p className="mt-0.5">{job.address_line || 'No address specified'}</p>
                {job.lat && job.lng && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[9px] text-slate-500 block font-mono">Coordinates: {job.lat.toFixed(4)}, {job.lng.toFixed(4)}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-750 px-2.5 py-1 rounded-xl text-[9px] font-extrabold text-rose-450 uppercase transition-all select-none hover:scale-105"
                    >
                      <Navigation className="h-2.5 w-2.5" />
                      Navigate To Customer
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 border-t border-slate-850/60 pt-3">
              <Clock className="h-4 w-4 text-rose-500 shrink-0" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Scheduled Timing</span>
                <p className="text-slate-300 font-semibold mt-0.5">
                  {new Date(job.scheduled_at).toLocaleString(undefined, { 
                    weekday: 'short', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing / Financial Ledger Details */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest px-1">Financial Breakdown</h3>
          
          <div className="bg-slate-950/40 border border-slate-850/60 rounded-3xl p-4 space-y-2.5 text-xs select-none">
            <div className="flex justify-between items-center text-slate-400">
              <span>Customer Invoiced Value</span>
              <span className="font-bold text-slate-200">₹{job.total_amount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-400">
              <span>Platform Service Commission (15%)</span>
              <span className="font-bold text-red-400">-₹{(job.total_amount * 0.15).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-850/60 pt-2.5 text-slate-300 font-bold">
              <span className="text-rose-450">Estimated Net Payout</span>
              <div className="flex items-center gap-0.5 font-extrabold text-sm text-white">
                <IndianRupee className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>₹{job.estimated_earnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional instructions notes if any */}
        {job.notes && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest px-1">Client Instructions</h3>
            <div className="bg-slate-950/30 border border-slate-850/40 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-slate-450 leading-relaxed font-semibold">
              <Info className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              {job.notes}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
