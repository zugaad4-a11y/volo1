'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { 
  MapPin, Clock, Navigation, ShieldCheck, 
  Award, Loader2, AlertCircle, RefreshCw, Radio
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface TrackingMetrics {
  distanceCoveredKm: number;
  activeTrackingHours: number;
  arrivalAccuracyPercent: number;
  completedSessionsCount: number;
}

export default function WorkerLocationDashboard() {
  const { data: dashboardData, mutate: mutateDashboard } = useSWR('/api/worker/dashboard', fetcher);
  const { data: reportData, error: reportError, isLoading: reportLoading, mutate: mutateReport } = useSWR('/api/worker/tracking-report', fetcher);
  
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsAccuracy, setCoordsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Sync browser GPS coordinates
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setCoordsAccuracy(pos.coords.accuracy);
        setGpsError(null);
      },
      (err) => {
        setGpsError(`GPS Access Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleRefreshMetrics = async () => {
    setSyncing(true);
    await Promise.all([mutateDashboard(), mutateReport()]);
    setSyncing(false);
  };

  if (reportLoading || !dashboardData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Loading tracking dashboard...</p>
      </div>
    );
  }

  const workerStatus = dashboardData.currentStatus || 'OFFLINE';
  const isTracking = workerStatus === 'ONLINE' || workerStatus === 'ON_JOB';
  const metrics: TrackingMetrics = reportData?.report || {
    distanceCoveredKm: 0,
    activeTrackingHours: 0,
    arrivalAccuracyPercent: 100,
    completedSessionsCount: 0
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] border border-white/[0.08] p-7 shadow-xl">
        <div className="absolute top-0 right-0 h-48 w-48 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <div className="flex justify-between items-center gap-4 relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${isTracking ? 'text-[#FF7A00] animate-pulse' : 'text-slate-600'}`} />
              <h1 className="text-2xl font-black tracking-tight text-white">Location & Tracking</h1>
            </div>
            <p className="text-xs text-slate-400 font-semibold">Real-time background GPS status and route telemetry.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full border ${
              workerStatus === 'ON_JOB' ? 'bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/30' :
              workerStatus === 'ONLINE' ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/30' :
              'bg-white/[0.04] text-slate-500 border-white/[0.08]'
            }`}>
              {workerStatus.replace(/_/g, ' ')}
            </span>
            <button
              type="button"
              onClick={handleRefreshMetrics}
              disabled={syncing}
              className="p-2.5 bg-[#070B14]/60 hover:bg-[#070B14] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* GPS Status + Active Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time GPS Status Card */}
        <div className={`bg-[#0F172A] border rounded-3xl p-6 shadow-xl space-y-4 transition-all duration-300 ${
          isTracking ? 'border-[#FF7A00]/30 ring-2 ring-orange-500/5' : 'border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                isTracking ? 'bg-[#FF7A00]/10 text-[#FF7A00]' : 'bg-[#070B14] text-slate-500'
              }`}>
                <Radio className={`h-5 w-5 ${isTracking ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Tracking Engine Status</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {isTracking ? 'GPS reports active in background' : 'Tracking paused — Go ONLINE to resume'}
                </p>
              </div>
            </div>
          </div>

          {/* Live GPS Coordinates display */}
          {gpsError ? (
            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex items-start gap-2.5 text-red-400 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              {gpsError}
            </div>
          ) : currentCoords ? (
            <div className="bg-[#070B14]/60 border border-white/[0.04] rounded-2xl p-4 space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Latitude</span>
                <span className="text-slate-200 font-bold">{currentCoords.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.04] pt-2.5">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Longitude</span>
                <span className="text-slate-200 font-bold">{currentCoords.lng.toFixed(6)}</span>
              </div>
              {coordsAccuracy !== null && (
                <div className="flex justify-between border-t border-white/[0.04] pt-2.5">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">GPS Accuracy</span>
                  <span className={`font-bold ${coordsAccuracy < 15 ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
                    ± {coordsAccuracy.toFixed(1)} meters
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500 font-bold">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-[#FF7A00]" />
              Resolving satellite coordinates...
            </div>
          )}
        </div>

        {/* Active Booking Context */}
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-lg space-y-3">
          <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Active Booking Context</h4>
          
          {dashboardData.activeJob ? (
            <div className="bg-[#070B14]/60 border border-white/[0.04] rounded-2xl p-4 space-y-3 text-xs select-none">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-slate-200">{dashboardData.activeJob.service_name}</h5>
                <span className="text-[9px] font-black text-[#FF7A00] uppercase">{dashboardData.activeJob.status}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed border-t border-white/[0.04] pt-2.5">
                Address: {dashboardData.activeJob.address_line}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-[#070B14]/40 border border-white/[0.04] border-dashed rounded-2xl">
              <Navigation className="h-6 w-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">No active job session running</p>
              <p className="text-[10px] text-slate-600 mt-1 font-semibold">Accept a job to see it here</p>
            </div>
          )}
        </div>
      </div>


      {/* Analytics Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-[#FF7A00]/10 flex items-center justify-center mb-1">
            <MapPin className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Distance Covered</span>
          <p className="text-2xl font-black text-white">{metrics.distanceCoveredKm.toFixed(1)}</p>
          <span className="text-[10px] text-slate-500 font-bold">kilometers</span>
        </div>

        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-1">
            <Clock className="h-5 w-5 text-[#38BDF8]" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Tracking Hours</span>
          <p className="text-2xl font-black text-white">{metrics.activeTrackingHours.toFixed(1)}</p>
          <span className="text-[10px] text-slate-500 font-bold">hours active</span>
        </div>

        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-1">
            <Award className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Arrival Accuracy</span>
          <p className="text-2xl font-black text-white">{metrics.arrivalAccuracyPercent}</p>
          <span className="text-[10px] text-slate-500 font-bold">percent</span>
        </div>

        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-1">
            <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Tracked Jobs</span>
          <p className="text-2xl font-black text-white">{metrics.completedSessionsCount}</p>
          <span className="text-[10px] text-slate-500 font-bold">completed</span>
        </div>
      </div>

    </div>
  );
}
