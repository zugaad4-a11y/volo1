'use client';

import React from 'react';
import useSWR from 'swr';
import { 
  Activity, Star, CheckCircle2, Clock, TrendingUp, 
  Loader2, AlertCircle, Award, Target, Zap
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function ScoreRing({ value, max = 100, color = '#FF7A00' }: { value: number; max?: number; color?: string }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="transparent" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white font-mono">{value}</span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

function MetricBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} 
      />
    </div>
  );
}

export default function WorkerPerformancePage() {
  const { data: dashboardData, error, isLoading } = useSWR('/api/worker/dashboard', fetcher);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Consolidating metrics...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="font-black text-white">Performance Unavailable</h3>
        <p className="text-xs text-slate-400 leading-relaxed">Failed to load performance metrics. Check your connection and try again.</p>
      </div>
    );
  }

  const jobsCompleted = dashboardData.completedJobsCount ?? 0;
  const totalJobs = (dashboardData.completedJobsCount ?? 0) + (dashboardData.cancelledJobsCount ?? 0);
  const rating = dashboardData.worker?.average_rating ? Number(dashboardData.worker.average_rating) : null;
  const completionRate = totalJobs > 0 ? Math.round((jobsCompleted / totalJobs) * 100) : 0;
  const acceptanceRate = totalJobs > 0 ? Math.round(((totalJobs - (dashboardData.cancelledJobsCount ?? 0)) / Math.max(totalJobs, 1)) * 100) : 0;
  const ratingScore = rating ? Math.round((rating / 5) * 100) : 0;
  const overallScore = Math.round(ratingScore * 0.5 + completionRate * 0.3 + acceptanceRate * 0.2);

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: '#22C55E' };
    if (score >= 75) return { label: 'Good', color: '#F59E0B' };
    if (score >= 50) return { label: 'Average', color: '#0EA5E9' };
    return { label: 'Improving', color: '#EF4444' };
  };

  const scoreInfo = getScoreLabel(overallScore);

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#FF7A00]" />
          Performance Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Your service quality score, acceptance rate, and overall partner health metrics.</p>
      </div>

      {/* Hero Score + Metric Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Score Ring Hero Card */}
        <div className="lg:col-span-4">
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-[#FF7A00]/5 blur-[50px] rounded-full pointer-events-none" />
            <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Overall Score</span>
            <ScoreRing value={overallScore} color={scoreInfo.color} />
            <div>
              <span 
                className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border"
                style={{ 
                  color: scoreInfo.color, 
                  backgroundColor: `${scoreInfo.color}18`,
                  borderColor: `${scoreInfo.color}30`
                }}
              >
                {scoreInfo.label}
              </span>
              <p className="text-[10px] text-slate-500 mt-3 font-semibold leading-relaxed">
                Weighted from rating (50%), completion (30%) and acceptance (20%)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Detail Metrics Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Rating Card */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg flex flex-col gap-4 group hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Star className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Weight: 50%</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Customer Rating</span>
              <p className="text-2xl font-black text-white mt-1 group-hover:text-amber-400 transition-colors">
                {rating !== null ? rating.toFixed(1) : 'N/A'}
                {rating !== null && <span className="text-sm font-bold text-slate-500"> / 5.0</span>}
              </p>
            </div>
            {rating !== null && <MetricBar value={rating} max={5} color="#F59E0B" />}
          </div>

          {/* Completion Rate Card */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg flex flex-col gap-4 group hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Weight: 30%</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Completion Rate</span>
              <p className="text-2xl font-black text-white mt-1 group-hover:text-emerald-400 transition-colors">{completionRate}%</p>
            </div>
            <MetricBar value={completionRate} color="#22C55E" />
          </div>

          {/* Acceptance Rate Card */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg flex flex-col gap-4 group hover:border-sky-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 text-sky-400" />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Weight: 20%</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Acceptance Rate</span>
              <p className="text-2xl font-black text-white mt-1 group-hover:text-sky-400 transition-colors">{acceptanceRate}%</p>
            </div>
            <MetricBar value={acceptanceRate} color="#0EA5E9" />
          </div>

          {/* Jobs Completed Card */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg flex flex-col gap-4 group hover:border-[#FF7A00]/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-[#FF7A00]" />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Milestone</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Jobs Completed</span>
              <p className="text-2xl font-black text-white mt-1 group-hover:text-[#FF7A00] transition-colors">{jobsCompleted}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <Zap className="h-3 w-3 text-[#FF7A00]" />
              <span>Total service dispatches completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 mb-5 select-none">
          <Target className="h-4 w-4 text-[#FF7A00]" />
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Performance Improvement Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Star, color: '#F59E0B', tip: 'Greet customers professionally and wear your partner ID badge to improve satisfaction scores.' },
            { icon: CheckCircle2, color: '#22C55E', tip: 'Avoid cancellations — maintain your completion rate above 90% for priority dispatch allocation.' },
            { icon: Activity, color: '#0EA5E9', tip: 'Respond to job offers within 60 seconds to maintain a high acceptance rate and unlock bonuses.' }
          ].map(({ icon: Icon, color, tip }, i) => (
            <div key={i} className="flex gap-3 p-4 bg-[#070B14]/60 rounded-2xl border border-white/[0.04]">
              <div className="h-7 w-7 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
