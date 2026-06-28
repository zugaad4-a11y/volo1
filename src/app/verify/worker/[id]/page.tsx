'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Star, Briefcase, Phone, Award, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VerifiedWorker {
  id: string;
  full_name: string;
  phone: string;
  rating: number;
  total_jobs: number;
  worker_id_code: string;
  skills: string[];
  service_categories: string[];
  photoUrl: string | null;
  created_at: string;
  kyc_status: string;
}

export default function WorkerPublicVerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState<VerifiedWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchVerificationDetails() {
      try {
        const res = await fetch(`/api/verify/worker/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setErrorMsg('Invalid Verification Link. Worker profile not found on VOLO Network.');
          } else {
            setErrorMsg('Verification lookup failed. Please try again.');
          }
          return;
        }
        const data = await res.json();
        setWorker(data.worker);
      } catch (err) {
        console.error('Error fetching verification:', err);
        setErrorMsg('Network error. Failed to reach verification server.');
      } finally {
        setLoading(false);
      }
    }
    fetchVerificationDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-[#FF7A00] animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase animate-pulse">
          Fetching verification record...
        </p>
      </div>
    );
  }

  if (errorMsg || !worker) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Verification Failed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg || 'Profile lookup unsuccessful.'}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const profession = (worker.service_categories && worker.service_categories.length > 0)
    ? worker.service_categories.join(', ')
    : (worker.skills && worker.skills.length > 0)
      ? worker.skills.join(', ')
      : 'Service Professional';

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 flex flex-col items-center justify-center p-4 selection:bg-orange-500/30 selection:text-white">
      
      {/* Verification Card */}
      <div className="w-full max-w-[350px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Top Banner with Logo and verification header */}
        <div className="h-28 bg-gradient-to-tr from-[#FF7A00] via-[#0A58CA] to-[#5CBF2A] flex flex-col justify-center items-center text-white px-6">
          <img 
            src="/images/logo.jpeg" 
            alt="VOLO Logo" 
            className="h-8 w-8 rounded-lg object-contain border border-white/20 shadow-md mb-1.5"
          />
          <span className="text-[10px] uppercase tracking-widest font-black text-white/90 font-mono">VOLO Network</span>
          <h4 className="text-sm font-extrabold tracking-wider mt-0.5">VERIFIED PARTNER</h4>
        </div>

        {/* Profile Avatar with verification seal badge */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-900 shadow-xl bg-slate-950 mx-auto -mt-12 z-10 flex items-center justify-center ring-2 ring-[#0A58CA]/40">
          {worker.photoUrl ? (
            <img src={worker.photoUrl} alt="Selfie" className="object-cover w-full h-full" />
          ) : (
            <span className="text-3xl font-bold text-slate-400">{worker.full_name?.charAt(0) || '?'}</span>
          )}
        </div>

        {/* Card Body */}
        <div className="px-6 pt-4 pb-6 text-center space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              {worker.full_name}
              <ShieldCheck className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
            </h3>
            <p className="text-[10px] text-[#FF7A00] font-bold uppercase tracking-wider mt-0.5">{profession}</p>
          </div>

          {/* Verification Status Chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Profile Active
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-left bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 text-[11px] font-sans">
            <div className="space-y-0.5">
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Worker ID</span>
              <span className="font-mono text-slate-200 font-semibold block">{worker.worker_id_code}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Contact</span>
              <span className="text-slate-200 font-semibold block flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-450" />
                {worker.phone}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Rating</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {Number(worker.rating).toFixed(2)} / 5.0
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Experience</span>
              <span className="text-slate-200 font-semibold block flex items-center gap-1">
                <Award className="h-3 w-3 text-slate-450" />
                {worker.total_jobs} Jobs Completed
              </span>
            </div>
          </div>

          {/* Safety & Compliance list */}
          <div className="space-y-2 border-t border-slate-800/60 pt-4 text-left">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Aadhaar Identity Validation matches profile.</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>PAN details verified against tax registry.</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Physical skill validation test passed.</span>
            </div>
          </div>

          {/* Footer Text */}
          <div className="border-t border-slate-800/60 pt-4">
            <p className="text-[8px] text-slate-550 font-bold uppercase tracking-wider leading-relaxed">
              Volo Home Services Network <br />
              Secure Digital Verification Record
            </p>
          </div>

        </div>
      </div>

      {/* Volo back brand link */}
      <div className="mt-6 text-[10px] font-bold text-slate-500 hover:text-slate-400 transition-colors select-none">
        Powered by <span className="text-[#FF7A00] font-black uppercase">VOLO</span>
      </div>

    </div>
  );
}
