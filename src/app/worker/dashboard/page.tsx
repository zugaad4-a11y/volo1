'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import dynamic from 'next/dynamic';
import { 
  Power, Loader2, AlertCircle, Camera, CheckCircle2, X, Navigation, 
  Phone, User, Clock, IndianRupee, Info, ShieldAlert, Check, 
  HelpCircle, Shield, Award, Calendar, DollarSign, ArrowUpRight, 
  MapPin, Activity, Star, MessageSquare, TrendingUp, Bell, Briefcase, 
  Wallet, ShieldCheck, IdCard
} from 'lucide-react';
import DigitalIdCardModal from '@/components/worker/DigitalIdCardModal';
import { supabaseClient } from '@/lib/supabase-client';
import { compressKycImage } from '@/lib/image-compression';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Dynamic import for Leaflet mini-map to prevent SSR (window is undefined) issues
const MiniDashboardMap = dynamic(() => import('@/components/MiniDashboardMap'), { ssr: false });

// Helper Component: Animated Counter from 0 to value
function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '' }: { value: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const incrementTime = Math.max(Math.floor(duration / Math.abs(end - start || 1)), 25);
    const step = (end - start) / (duration / incrementTime);
    
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(current);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedCount = value % 1 === 0 
    ? Math.round(count).toLocaleString('en-IN') 
    : count.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return <span>{prefix}{formattedCount}{suffix}</span>;
}

// Helper Component: Real-time countdown timer for job offers
function OfferCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiresAt) - +new Date();
      return Math.max(Math.floor(difference / 1000), 0);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-rose-500 text-xs font-bold font-mono">
      <Clock className="h-3.5 w-3.5 animate-pulse" />
      <span>Offer expires in: {formatTime(timeLeft)}</span>
    </div>
  );
}

// Helper Component: SVG Radial Progress Ring
function RadialGauge({ value, max = 100, size = 64, strokeWidth = 5, color = '#FF7A00', title = '' }: { value: number; max?: number; size?: number; strokeWidth?: number; color?: string; title: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-[#0F172A] border border-white/[0.04] rounded-2xl shadow-md">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-white font-mono">{value}</span>
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center truncate max-w-[80px]">{title}</span>
    </div>
  );
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Dashboard SWR
  const { data: dashboardData, error, isLoading } = useSWR('/api/worker/dashboard', fetcher, {
    refreshInterval: 15000 // Poll dashboard stats every 15s for high responsiveness
  });

  // Manual Offers SWR
  const { data: manualOffersData, mutate: mutateOffers } = useSWR('/api/worker/manual-offers', fetcher, {
    refreshInterval: 10000 // Poll manual assignments frequently
  });

  // Earnings SWR (Filtered by period)
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data: earningsData } = useSWR(`/api/worker/earnings?period=${earningsPeriod}`, fetcher);

  // Settlements SWR
  const { data: settlementsData } = useSWR('/api/worker/settlements', fetcher);

  // Active Job Details SWR (Triggered only if dashboard indicates an active job)
  const activeJobId = dashboardData?.activeJob?.id;
  const { data: activeJobDetails, mutate: mutateActiveJob } = useSWR(
    activeJobId ? `/api/worker/jobs/${activeJobId}` : null, 
    fetcher
  );

  // User Session SWR
  const { data: userData } = useSWR('/api/auth/me', fetcher);
  const user = userData?.user;

  // ID Card SWR fetches & state
  const { data: profileData } = useSWR('/api/worker/profile', fetcher);
  const { data: kycData } = useSWR('/api/worker/kyc', fetcher);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // States
  const [statusToggling, setStatusToggling] = useState(false);
  const [toggleError, setToggleError] = useState('');
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  // OTP Verification
  const [otpValue, setOtpValue] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Work Verification Upload
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [jobUpdateError, setJobUpdateError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation tracker state
  const [workerCoords, setWorkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSyncTime, setGpsSyncTime] = useState<string>('Not synced');

  // Monitor location in browser for mini-map centering
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setWorkerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(pos.coords.accuracy);
        setGpsSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      },
      (err) => {
        console.warn('[Dashboard Geolocator] Browser GPS error:', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Sync state if dashboard data changes
  useEffect(() => {
    if (dashboardData) {
      setOptimisticStatus(null);
    }
  }, [dashboardData]);

  // Duty Toggle
  const handleToggleStatus = async () => {
    if (!dashboardData) return;
    const isApproved = dashboardData.kycStatus === 'APPROVED';
    if (!isApproved) return;

    setToggleError('');
    setStatusToggling(true);

    const currentStatus = optimisticStatus || dashboardData.currentStatus;
    const nextStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setOptimisticStatus(nextStatus);

    let coords = workerCoords;
    if (nextStatus === 'ONLINE' && !coords) {
      try {
        const getPosition = () => {
          return new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
        };
        const pos = await getPosition();
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setWorkerCoords(coords);
      } catch (err) {
        console.warn('Fallback: Online status set without coordinates', err);
      }
    }

    try {
      const res = await fetch('/api/worker/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update status.');

      await mutate('/api/worker/dashboard');
    } catch (err: any) {
      setToggleError(err.message || 'Status toggle failed.');
      setOptimisticStatus(null);
    } finally {
      setStatusToggling(false);
    }
  };

  // Active Job Actions
  const handleUpdateActiveJobStatus = async (nextStatus: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED') => {
    if (!activeJobId) return;
    setJobUpdateError('');
    setVerifyingOtp(false);

    try {
      let imageUrl = null;

      if (nextStatus === 'COMPLETED') {
        if (!proofImage) {
          throw new Error('Please take/upload a photo of the completed service for verification.');
        }

        setUploadingImage(true);
        const compressedFile = await compressKycImage(proofImage, 'WORK_PROOF');
        const fileName = `job_${activeJobId}_completion_${Date.now()}.webp`;
        const uploadPath = `worker_${dashboardData.activeJob.worker_id || 'verification'}/${fileName}`;
        
        const { data: uploadData, error: uploadErr } = await supabaseClient.storage
          .from('booking-images')
          .upload(uploadPath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadErr) {
          setUploadingImage(false);
          throw new Error(`Failed to upload completion image: ${uploadErr.message}`);
        }
        
        imageUrl = uploadData.path;
        setUploadingImage(false);
      }

      const res = await fetch(`/api/worker/jobs/${activeJobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, imageUrl })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      
      setProofImage(null);
      await mutateActiveJob();
      await mutate('/api/worker/dashboard');
    } catch (err: any) {
      setJobUpdateError(err.message || 'Error updating service status.');
      setUploadingImage(false);
    }
  };

  // OTP submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    if (!otpValue || otpValue.length < 4) {
      setOtpError('Enter a valid 4-digit code.');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');
    setJobUpdateError('');
    
    try {
      const res = await fetch(`/api/worker/jobs/${activeJobId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect OTP code.');
      
      setOtpValue('');
      await mutateActiveJob();
      await mutate('/api/worker/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Accept/Decline Manual Direct Offers
  const handleDirectOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      const endpoint = `/api/worker/manual-offers/${offerId}/${action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: 'DECLINED_BY_WORKER' }) : undefined
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Direct offer ${action} failed.`);

      // Refresh data
      await mutateOffers();
      await mutate('/api/worker/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  // Broadcast Action Handlers
  const [broadcastActioningId, setBroadcastActioningId] = useState<string | null>(null);
  const [broadcastActionError, setBroadcastActionError] = useState('');

  const handleAcceptBroadcastJob = async (jobId: string) => {
    setBroadcastActioningId(jobId);
    setBroadcastActionError('');
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept booking.');
      
      await mutate('/api/worker/dashboard');
      router.push(`/worker/jobs/${jobId}`);
    } catch (err: any) {
      setBroadcastActionError(err.message || 'Error accepting service request.');
    } finally {
      setBroadcastActioningId(null);
    }
  };

  const handleRejectBroadcastJob = async (jobId: string) => {
    setBroadcastActioningId(jobId);
    setBroadcastActionError('');
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject booking.');
      
      await mutate('/api/worker/dashboard');
    } catch (err: any) {
      setBroadcastActionError(err.message || 'Error rejecting service request.');
    } finally {
      setBroadcastActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-semibold uppercase tracking-widest animate-pulse">Syncing metrics...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-xl shadow-red-500/5">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto animate-bounce" />
        <h3 className="font-extrabold text-white text-base">Dashboard Connectivity Error</h3>
        <p className="text-xs text-slate-400 leading-relaxed">We encountered a problem establishing connection to your partner statistics. Check your internet connection and retry.</p>
        <button
          type="button"
          onClick={() => mutate('/api/worker/dashboard')}
          className="px-6 py-2.5 bg-[#EF4444] hover:bg-red-500 rounded-2xl text-xs font-black text-white uppercase tracking-wider transition-all select-none shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  const isKycApproved = dashboardData.kycStatus === 'APPROVED';
  const currentStatus = optimisticStatus || dashboardData.currentStatus;
  const isOnline = currentStatus === 'ONLINE';

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Direct active manual offers
  const pendingDirectOffers = manualOffersData?.offers?.filter((o: any) => o.status === 'ASSIGNED') || [];

  return (
    <div className="space-y-6">
      
      {/* 1. KYC Alert Block if not approved */}
      {!isKycApproved && (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl flex items-start gap-4 text-red-400 text-xs shadow-xl animate-pulse">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-500" />
          <div className="space-y-2">
            <span className="font-black uppercase tracking-widest text-[9px] block">Administrative Action Required</span>
            <p className="text-slate-300 leading-relaxed font-semibold">
              Your technician profile verification is currently pending. Administrative KYC approval is required before you can toggle duty online and accept service jobs.
            </p>
            <button
              type="button"
              onClick={() => router.push('/worker/kyc')}
              className="inline-flex items-center gap-1 bg-[#EF4444] hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors tracking-wider shadow shadow-red-500/10 cursor-pointer"
            >
              Go to KYC Documents Upload
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left major column, right widgets sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Duty toggling, active job tracking, and countdown job dispatches */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hero Greetings Summary */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Technician Center</span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Akhil'} 👋
                </h2>
                <p className="text-xs text-[#FF7A00] font-bold mt-1">
                  {isOnline ? '🟢 Ready for dispatches' : '🔴 Offline • Toggle online to start working'}
                </p>
              </div>

              {/* Verified Partner Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 self-start md:self-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    {dashboardData.kycStatus === 'APPROVED' ? 'Verified Partner' : 'Verification Pending'}
                  </span>
                </div>
                {isKycApproved && (
                  <button
                    type="button"
                    onClick={() => setShowIdCardModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-650 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase text-white tracking-wider transition-colors cursor-pointer select-none"
                  >
                    <IdCard className="h-3.5 w-3.5 text-[#FF7A00]" />
                    View ID Card
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6">
              
              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Today's Net</span>
                <div className="text-sm font-extrabold text-white mt-1">
                  <AnimatedCounter value={earningsData?.summary?.total || 1250} prefix="₹" />
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Completed</span>
                <div className="text-sm font-extrabold text-[#22C55E] mt-1">
                  <AnimatedCounter value={dashboardData.completedJobsCount || 8} />
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Active Jobs</span>
                <div className="text-sm font-extrabold text-[#0EA5E9] mt-1">
                  <AnimatedCounter value={dashboardData.activeJob ? 1 : 0} />
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Pending Offers</span>
                <div className="text-sm font-extrabold text-[#F59E0B] mt-1">
                  <AnimatedCounter value={pendingDirectOffers.length} />
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Acceptance</span>
                <div className="text-sm font-extrabold text-white mt-1">
                  <AnimatedCounter value={95} suffix="%" />
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/[0.04] p-3 rounded-2xl text-center shadow-md">
                <span className="text-[8px] uppercase font-black text-slate-500 tracking-wider block">Completion</span>
                <div className="text-sm font-extrabold text-white mt-1">
                  <AnimatedCounter value={98} suffix="%" />
                </div>
              </div>

            </div>
          </div>

          {/* ONLINE STATUS CARD */}
          <div className={`bg-[#0F172A] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 ${
            isOnline ? 'border-[#22C55E]/40 shadow-[#22C55E]/2' : 'border-white/[0.08]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-500'}`} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    Duty status: {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </h3>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed max-w-md">
                  {isOnline 
                    ? 'You are currently active on duty. Your live location is broadcasting to customer dispatches for nearby service allocations.'
                    : 'You are currently offline. You will not receive any service dispatches or automated bookings.'}
                </p>
              </div>

              {/* Slidable Switch */}
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={!isKycApproved || statusToggling}
                className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 border focus:outline-none ${
                  !isKycApproved 
                    ? 'bg-slate-800 border-white/[0.05] cursor-not-allowed opacity-30'
                    : isOnline 
                    ? 'bg-[#22C55E]/20 border-[#22C55E]/50' 
                    : 'bg-[#EF4444]/20 border-[#EF4444]/50'
                }`}
              >
                <span className="sr-only">Toggle Online Status</span>
                <span
                  className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-300 flex items-center justify-center ${
                    isOnline 
                      ? 'translate-x-9 bg-[#22C55E] shadow-md shadow-[#22C55E]/40' 
                      : 'translate-x-1.5 bg-[#EF4444] shadow-md shadow-red-500/40'
                  }`}
                >
                  {statusToggling ? (
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  ) : (
                    <Power className="h-2.5 w-2.5 text-white" />
                  )}
                </span>
              </button>
            </div>

            {toggleError && (
              <p className="text-[10px] text-red-400 font-bold bg-red-500/5 px-3.5 py-1.5 rounded-xl border border-red-500/10 mt-3">
                ⚠️ {toggleError}
              </p>
            )}

            {/* GPS Telemetry Metadata strip */}
            {isOnline && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#070B14]/60 border border-white/[0.04] p-3 rounded-2xl text-[10px] mt-5 select-none font-semibold text-slate-400">
                <div>
                  <span className="text-slate-500 font-black block uppercase tracking-wider">Tracking State</span>
                  <span className="text-emerald-400 font-bold">🟢 Active Location</span>
                </div>
                <div>
                  <span className="text-slate-500 font-black block uppercase tracking-wider">Device Coordinates</span>
                  <span className="font-mono text-slate-200">
                    {workerCoords ? `${workerCoords.lat.toFixed(4)}, ${workerCoords.lng.toFixed(4)}` : 'Resolving GPS...'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-black block uppercase tracking-wider">Sync Quality</span>
                  <span className={gpsAccuracy !== null && gpsAccuracy < 20 ? 'text-[#22C55E]' : 'text-[#F59E0B]'}>
                    {gpsAccuracy !== null ? `± ${gpsAccuracy.toFixed(1)} meters` : 'Fetching quality'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-black block uppercase tracking-wider">Last Coordinates Sync</span>
                  <span className="text-slate-200 font-mono">{gpsSyncTime}</span>
                </div>
              </div>
            )}
          </div>

          {/* NEW JOB OFFERS SECTION */}
          {pendingDirectOffers.length > 0 && (
            <div className="space-y-4 select-none">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">New Job Allocations</h3>
              
              <div className="space-y-3">
                {pendingDirectOffers.map((offer: any) => (
                  <div 
                    key={offer.id} 
                    className="bg-[#0F172A] border border-orange-500/30 ring-1 ring-orange-500/10 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all hover:scale-[1.005] duration-300 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-orange-500/10 border border-orange-500/20 text-[#FF7A00]">
                          Direct Offer
                        </span>
                        <OfferCountdown 
                          expiresAt={offer.expiresAt} 
                          onExpire={() => mutateOffers()} 
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-white leading-tight">{offer.serviceName}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Customer Address: {offer.addressLine || 'Unavailable'}
                        </p>
                      </div>

                      <div className="flex gap-4 text-[10px] font-bold text-slate-400 border-t border-white/[0.04] pt-2.5">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#FF7A00]" /> {offer.distanceKm} km away</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#FF7A00]" /> Scheduled: {new Date(offer.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 self-start md:self-stretch min-w-[120px]">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Estimated Payout</span>
                        <span className="text-base font-black text-white flex items-center justify-end gap-0.5 mt-0.5">
                          <IndianRupee className="h-4 w-4 text-[#FF7A00]" />
                          ₹{offer.estimatedEarnings.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleDirectOfferAction(offer.id, 'reject')}
                          className="flex-1 md:flex-none px-4 py-2 bg-[#070B14] hover:bg-[#070B14]/80 border border-white/[0.06] rounded-xl text-xs font-bold uppercase text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectOfferAction(offer.id, 'accept')}
                          className="flex-1 md:flex-none px-5 py-2 bg-[#FF7A00] hover:bg-[#FF9E43] rounded-xl text-xs font-black uppercase text-white shadow shadow-orange-500/20 cursor-pointer transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE BROADCAST OFFERS SECTION */}
          {dashboardData.broadcastJobs && dashboardData.broadcastJobs.length > 0 && (
            <div className="space-y-4 select-none animate-fade-in">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest pl-1">Live Broadcast Dispatches</h3>
              
              {broadcastActionError && (
                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold shadow">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-555" />
                  {broadcastActionError}
                </div>
              )}

              <div className="space-y-3">
                {dashboardData.broadcastJobs.map((job: any) => (
                  <div 
                    key={job.id} 
                    className="bg-[#0F172A] border border-orange-500/30 ring-1 ring-orange-500/10 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all hover:scale-[1.005] duration-300 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-orange-550/10 border border-orange-500/20 text-[#FF7A00] animate-pulse">
                          Live Broadcast
                        </span>
                        {job.expiresAt && (
                          <OfferCountdown 
                            expiresAt={job.expiresAt} 
                            onExpire={() => mutate('/api/worker/dashboard')} 
                          />
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-white leading-tight">{job.service_name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Client: {job.customer_first_name} • Locality: {job.locality}
                        </p>
                      </div>

                      <div className="flex gap-4 text-[10px] font-bold text-slate-450 border-t border-white/[0.04] pt-2.5">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#FF7A00]" /> {job.distance_km} km away</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#FF7A00]" /> Scheduled: {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 self-start md:self-stretch min-w-[120px]">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Estimated Payout</span>
                        <span className="text-base font-black text-white flex items-center justify-end gap-0.5 mt-0.5">
                          <IndianRupee className="h-4 w-4 text-[#FF7A00]" />
                          ₹{job.estimated_earnings.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleRejectBroadcastJob(job.id)}
                          disabled={broadcastActioningId !== null}
                          className="flex-1 md:flex-none px-4 py-2 bg-[#070B14] hover:bg-[#070B14]/80 border border-white/[0.06] rounded-xl text-xs font-bold uppercase text-slate-450 hover:text-red-400 cursor-pointer transition-colors disabled:opacity-40"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptBroadcastJob(job.id)}
                          disabled={broadcastActioningId !== null}
                          className="flex-1 md:flex-none px-5 py-2 bg-[#FF7A00] hover:bg-[#FF9E43] rounded-xl text-xs font-black uppercase text-white shadow shadow-orange-500/20 cursor-pointer transition-colors disabled:opacity-40"
                        >
                          {broadcastActioningId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Accept'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE JOB CARD SECTION */}
          {dashboardData.activeJob && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Active Dispatch context</h3>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-[#FF7A00]/10 border border-[#FF7A00]/25 text-[#FF7A00] animate-pulse">
                  ON TRIP ({dashboardData.activeJob.status.replace(/_/g, ' ')})
                </span>
              </div>

              <div className="bg-[#0F172A] border border-[#FF7A00]/20 rounded-3xl p-6 shadow-xl space-y-6 relative">
                
                {/* Visual Trip Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Trip Details column */}
                  <div className="space-y-5">
                    
                    {/* Header: Service name & address */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Service Allocation</span>
                      <h4 className="text-base font-extrabold text-white leading-tight">
                        {dashboardData.activeJob.service_name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Booking ID: {dashboardData.activeJob.id}</p>
                    </div>

                    {/* Address Box */}
                    <div className="flex items-start gap-3 bg-[#070B14]/60 border border-white/[0.04] p-4 rounded-2xl text-xs leading-relaxed text-slate-300">
                      <MapPin className="h-5 w-5 text-[#FF7A00] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-white">Client Service Location</p>
                        <p className="mt-0.5 text-slate-400">{dashboardData.activeJob.address_line || 'No address specified'}</p>
                        {dashboardData.activeJob.lat && dashboardData.activeJob.lng && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${dashboardData.activeJob.lat},${dashboardData.activeJob.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-[#0F172A] border border-white/[0.08] hover:border-white/[0.15] px-3 py-1 rounded-xl text-[9px] font-black uppercase text-[#FF7A00] transition-transform active:scale-95"
                            >
                              <Navigation className="h-2.5 w-2.5" />
                              Google Maps Navigate
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Info and contact buttons */}
                    {activeJobDetails && (
                      <div className="border-t border-white/[0.04] pt-4 space-y-3 select-none">
                        <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Customer details</span>
                        
                        <div className="flex items-center justify-between bg-[#070B14]/40 p-3.5 rounded-2xl border border-white/[0.04] text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center font-bold text-xs uppercase text-[#FF7A00]">
                              {activeJobDetails.customer?.full_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-200">{activeJobDetails.customer?.full_name || 'Client'}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">OTP Required at Arrival</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {activeJobDetails.customer?.phone && (
                              <a
                                href={`tel:${activeJobDetails.customer.phone}`}
                                className="h-8 px-3.5 rounded-xl bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/30 flex items-center justify-center gap-1.5 text-[9px] font-black text-sky-400 uppercase tracking-wider transition-all hover:scale-105"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                Call Client
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Customer Instructions if any */}
                        {activeJobDetails.notes && (
                          <div className="p-3 bg-slate-950/20 border border-white/[0.04] rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-450 font-medium">
                            <Info className="h-4 w-4 text-[#FF7A00] shrink-0 mt-0.5" />
                            <span>Client Instructions: "{activeJobDetails.notes}"</span>
                          </div>
                        )}

                        {/* Financial Ledger Widget */}
                        <div className="bg-[#070B14]/30 border border-white/[0.04] p-3.5 rounded-2xl flex justify-between items-center text-xs">
                          <span className="text-slate-450 font-bold">Trip Value: ₹{activeJobDetails.total_amount.toFixed(2)}</span>
                          <span className="text-white font-extrabold flex items-center gap-0.5">
                            Net Payout: <IndianRupee className="h-3 w-3 text-[#FF7A00] shrink-0" />
                            <span className="text-[#FF7A00]">₹{activeJobDetails.estimated_earnings.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Mini Map Layer */}
                  <div className="h-56 md:h-full md:min-h-[280px]">
                    <MiniDashboardMap
                      workerLat={workerCoords?.lat || null}
                      workerLng={workerCoords?.lng || null}
                      customerLat={dashboardData.activeJob.lat}
                      customerLng={dashboardData.activeJob.lng}
                      customerName={activeJobDetails?.customer?.full_name || 'Client'}
                    />
                  </div>

                </div>

                {/* Inline Action Form Row (Status changes / OTP verify / file uploads) */}
                <div className="border-t border-white/[0.06] pt-5 select-none">
                  
                  {jobUpdateError && (
                    <p className="text-[10px] text-red-400 font-bold bg-red-500/5 px-3.5 py-1.5 rounded-xl border border-red-500/10 mb-4">
                      ⚠️ {jobUpdateError}
                    </p>
                  )}

                  {/* Flow Buttons */}
                  {dashboardData.activeJob.status === 'WORKER_ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveJobStatus('ON_THE_WAY')}
                      className="w-full py-4 px-6 rounded-2xl bg-[#FF7A00] hover:bg-[#FF9E43] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className="h-4.5 w-4.5 animate-pulse" />
                      Start Journey (En Route)
                    </button>
                  )}

                  {dashboardData.activeJob.status === 'ON_THE_WAY' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveJobStatus('ARRIVED')}
                      className="w-full py-4 px-6 rounded-2xl bg-[#FF7A00] hover:bg-[#FF9E43] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="h-4.5 w-4.5 animate-bounce" />
                      Mark Arrived at Client Place
                    </button>
                  )}

                  {dashboardData.activeJob.status === 'ARRIVED' && (
                    <div className="bg-[#070B14] border border-white/[0.04] p-5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-[#FF7A00] text-xs font-black uppercase">
                        <LockIcon className="h-4 w-4" />
                        Verification OTP required to start service
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">Enter the 4-digit code provided by the client to authenticate arrival and start job tracking.</p>
                      
                      <form onSubmit={handleVerifyOtp} className="flex gap-2.5">
                        <input
                          type="text"
                          maxLength={4}
                          pattern="\d*"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 4-digit code"
                          disabled={verifyingOtp}
                          className="flex-1 bg-[#0F172A] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-xl px-4 py-2.5 text-xs text-center font-extrabold tracking-widest text-white placeholder-slate-600 outline-none transition-all disabled:opacity-40"
                        />
                        <button
                          type="submit"
                          disabled={verifyingOtp || otpValue.length < 4}
                          className="bg-[#22C55E] hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow shadow-emerald-500/10 cursor-pointer disabled:opacity-30"
                        >
                          {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Job'}
                        </button>
                      </form>
                      {otpError && (
                        <p className="text-[10px] text-red-400 font-bold bg-red-500/5 px-3 py-1.5 border border-red-500/10 rounded-lg">
                          ⚠️ {otpError}
                        </p>
                      )}
                    </div>
                  )}

                  {dashboardData.activeJob.status === 'IN_PROGRESS' && (
                    <div className="bg-[#070B14] border border-white/[0.04] p-5 rounded-2xl space-y-4">
                      <h5 className="text-xs font-extrabold text-white">Capture / Upload Work Verification</h5>
                      <p className="text-[10px] text-slate-500 leading-normal">Take a clear picture of the completed service or upload an image from your device to finalize client booking invoice.</p>
                      
                      {!proofImage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#0F172A]/70 border border-white/[0.08] border-dashed text-slate-350 py-6 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none"
                          >
                            <Camera className="h-6 w-6 text-[#FF7A00] mb-1" />
                            <span>Take Photo / Choose Image</span>
                            <span className="text-[9px] text-slate-500 font-normal">Supports camera capture and gallery uploads on all devices</span>
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
                        <div className="space-y-3">
                          <div className="bg-[#0F172A] px-4 py-2.5 rounded-xl flex items-center justify-between border border-[#22C55E]/20">
                            <span className="text-xs text-[#22C55E] truncate flex-1 font-mono">{proofImage.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setProofImage(null)}
                              disabled={uploadingImage}
                              className="text-slate-500 hover:text-red-400 p-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveJobStatus('COMPLETED')}
                            disabled={uploadingImage}
                            className="w-full py-3 px-6 rounded-xl bg-[#22C55E] hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading image to server...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Finalize & Complete Booking
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Fallback Radar scan map if no active job */}
          {!dashboardData.activeJob && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Live Telemetry</h3>
              <div className="h-60 sm:h-72">
                <MiniDashboardMap
                  workerLat={workerCoords?.lat || null}
                  workerLng={workerCoords?.lng || null}
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Sidebar Widgets (Schedule, Settlements, Performance, Actions) */}
        <div className="space-y-6">

          {/* Quick Floating Action links */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 select-none">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Quick Tools</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => router.push('/worker/availability')}
                className="flex items-center gap-3.5 bg-[#070B14]/60 hover:bg-[#111827] p-3.5 rounded-2xl border border-white/[0.05] hover:border-[#FF7A00]/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/5 group cursor-pointer text-left w-full"
              >
                <div className="h-9 w-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Clock className="h-4.5 w-4.5 text-[#F59E0B]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-white text-xs block group-hover:text-[#FF7A00] transition-colors truncate">Duty Switch</span>
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5 truncate">Set online hours</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/worker/jobs')}
                className="flex items-center gap-3.5 bg-[#070B14]/60 hover:bg-[#111827] p-3.5 rounded-2xl border border-white/[0.05] hover:border-[#0EA5E9]/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/5 group cursor-pointer text-left w-full"
              >
                <div className="h-9 w-9 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Briefcase className="h-4.5 w-4.5 text-[#0EA5E9]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-white text-xs block group-hover:text-[#0EA5E9] transition-colors truncate">All Jobs</span>
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5 truncate">Accept bookings</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/worker/settlements')}
                className="flex items-center gap-3.5 bg-[#070B14]/60 hover:bg-[#111827] p-3.5 rounded-2xl border border-white/[0.05] hover:border-[#22C55E]/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 group cursor-pointer text-left w-full"
              >
                <div className="h-9 w-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Wallet className="h-4.5 w-4.5 text-[#22C55E]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-white text-xs block group-hover:text-[#22C55E] transition-colors truncate">Payout History</span>
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5 truncate">Track payments</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/worker/kyc')}
                className="flex items-center gap-3.5 bg-[#070B14]/60 hover:bg-[#111827] p-3.5 rounded-2xl border border-white/[0.05] hover:border-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5 group cursor-pointer text-left w-full"
              >
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="h-4.5 w-4.5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-white text-xs block group-hover:text-violet-400 transition-colors truncate">KYC Docs</span>
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5 truncate">Profile checks</span>
                </div>
              </button>
            </div>
          </div>

          {/* Settlement Center Card */}
          {settlementsData && (
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 select-none">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Settlement Center</h4>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]">
                  Auto Payout
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Next Settlement</span>
                    <span className="text-slate-300 font-extrabold mt-1 block">Wednesday 10:00 AM</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Pending Payout</span>
                    <span className="text-base font-black text-white flex items-center justify-end gap-0.5 mt-0.5">
                      <IndianRupee className="h-4 w-4 text-[#FF7A00]" />
                      ₹{(settlementsData.earnings?.pending_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar timeline */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex justify-between text-[9px] font-extrabold text-slate-500">
                    <span>EARNED</span>
                    <span>AUDITED</span>
                    <span>DISBURSED</span>
                  </div>
                  <div className="h-2 w-full bg-[#070B14] rounded-full overflow-hidden p-0.5 border border-white/[0.03] relative">
                    <div 
                      className={`h-full bg-gradient-to-r from-[#FF7A00] to-[#22C55E] rounded-full transition-all duration-1000 ${
                        (settlementsData.earnings?.pending_amount > 0) ? 'w-2/3 animate-pulse' : 'w-full'
                      }`} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal italic text-center font-medium">
                    {(settlementsData.earnings?.pending_amount > 0) 
                      ? 'Funds audited. Standard ledger transfer pending.' 
                      : 'All completed bookings successfully settled to bank.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Today's Timeline Schedule */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 select-none">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Today's Timeline</h4>
            
            {dashboardData.upcomingJobs?.length > 0 ? (
              <div className="relative pl-4 border-l border-white/[0.06] space-y-5 py-1 text-xs">
                {dashboardData.upcomingJobs.map((job: any, index: number) => (
                  <div key={job.id} className="relative group">
                    {/* Bullet marker */}
                    <div className="absolute -left-[20.5px] top-1 h-3.5 w-3.5 rounded-full bg-[#0F172A] border-2 border-[#FF7A00] flex items-center justify-center shadow shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] text-[#FF7A00] font-black font-mono uppercase">
                        {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{job.service_name || 'Home Service'}</p>
                      <span className="text-[10px] text-slate-500 block font-medium">Status: {job.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-[#070B14]/40 rounded-2xl border border-white/[0.04] text-xs font-semibold text-slate-500">
                No upcoming jobs scheduled for today
              </div>
            )}
          </div>

          {/* Earnings Analytics area charts */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 select-none">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Earnings Analytics</h4>
              
              <div className="flex bg-[#070B14]/80 p-0.5 rounded-xl border border-white/[0.05] text-[9px] font-black uppercase">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setEarningsPeriod(period)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      earningsPeriod === period 
                        ? 'bg-[#FF7A00] text-white' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {earningsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center text-xs select-none">
                  <div className="bg-[#070B14]/40 border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-slate-500 block">Payout (85%)</span>
                    <span className="font-black text-white mt-0.5 block">₹{earningsData.summary?.total?.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#070B14]/40 border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-slate-500 block">Commissions (15%)</span>
                    <span className="font-black text-red-400 mt-0.5 block">-₹{earningsData.summary?.commission?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Recharts area graph */}
                <div className="h-28 w-full mt-2">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <AreaChart
                        data={earningsData.chartData || []}
                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#FF7A00" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="label" 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={8} 
                          tickLine={false} 
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={8} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F172A', 
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            fontSize: '10px'
                          }}
                          labelClassName="text-slate-400"
                          itemStyle={{ color: '#FF7A00' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#FF7A00" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorEarnings)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-bold">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#FF7A00] mb-2" />
                Retrieving ledger logs...
              </div>
            )}
          </div>

          {/* Performance Dashboard circular meters */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 select-none">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Quality scorecard</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <RadialGauge 
                value={4.8} 
                max={5.0} 
                strokeWidth={4.5}
                color="#F59E0B"
                title="Customer Rating" 
              />
              <RadialGauge 
                value={95} 
                max={100} 
                strokeWidth={4.5}
                color="#0EA5E9"
                title="Accept Rate" 
              />
              <RadialGauge 
                value={98} 
                max={100} 
                strokeWidth={4.5}
                color="#22C55E"
                title="Complete Rate" 
              />
            </div>

            {/* Quality Badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
              <span className="px-2.5 py-1 rounded bg-[#0EA5E9]/10 text-sky-400 text-[9px] font-black uppercase tracking-wider">
                ⚡ Pro Partner
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                ★ Top Rated
              </span>
              <span className="px-2.5 py-1 rounded bg-[#22C55E]/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                ✓ Safety Audited
              </span>
            </div>
          </div>

          {/* KYC Status Details badge tracker */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Verification Index</h4>
              <span className="text-[10px] font-black text-[#FF7A00] font-mono">
                {dashboardData.profileCompletion}% Complete
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#070B14]/40 border border-white/[0.04] rounded-xl">
                <span className="text-slate-300 font-bold">Aadhaar Verification</span>
                <span className="text-[#22C55E] font-black text-[9px] uppercase tracking-wider">Approved Badge</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#070B14]/40 border border-white/[0.04] rounded-xl">
                <span className="text-slate-300 font-bold">PAN Verification</span>
                <span className="text-[#22C55E] font-black text-[9px] uppercase tracking-wider">Approved Badge</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#070B14]/40 border border-white/[0.04] rounded-xl">
                <span className="text-slate-300 font-bold">Bank Verification</span>
                <span className="text-[#22C55E] font-black text-[9px] uppercase tracking-wider">Approved Badge</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#070B14]/40 border border-white/[0.04] rounded-xl">
                <span className="text-slate-300 font-bold">Address Verification</span>
                <span className="text-[#22C55E] font-black text-[9px] uppercase tracking-wider">Approved Badge</span>
              </div>
            </div>
          </div>

          {/* Support emergency SOS floating box */}
          <div className="bg-[#EF4444]/10 border border-red-500/20 rounded-3xl p-5 shadow-xl text-center space-y-3.5 select-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#EF4444]" />
            <h5 className="text-xs font-black text-[#EF4444] uppercase tracking-widest">Emergency Assistance SOS</h5>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">Experiencing an accident, customer threat, or safety risk? Press below to trigger support response.</p>
            
            <a 
              href="tel:100"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#EF4444] hover:bg-red-650 rounded-xl text-xs font-black uppercase text-white shadow shadow-red-500/20 transition-transform active:scale-95 duration-150"
            >
              <ShieldAlert className="h-4 w-4 animate-bounce" />
              Trigger SOS Emergency
            </a>
          </div>

        </div>

      </div>

      {isKycApproved && (
        <DigitalIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          worker={
            profileData && kycData
              ? {
                  id: user?.id,
                  full_name: user?.full_name || profileData.full_name,
                  phone: user?.phone || profileData.phone,
                  dob: kycData.bankDetails?.dob || profileData.dob,
                  worker_id_code: kycData.bankDetails?.worker_id_code || profileData.worker_id_code,
                  skills: profileData.skills || []
                }
              : null
          }
          photoUrl={
            kycData?.documents?.find((d: any) => d.document_type === 'PROFILE_PHOTO')?.signedUrl 
              || kycData?.documents?.find((d: any) => d.document_type === 'SELFIE_VERIFICATION')?.signedUrl
          }
        />
      )}

    </div>
  );
}

// Custom Lock Icon
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
