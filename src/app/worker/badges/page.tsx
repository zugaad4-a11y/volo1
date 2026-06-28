'use client';

import React from 'react';
import useSWR from 'swr';
import { ShieldCheck, Award, Zap, Star, Trophy, Target, Lock, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const EARNED_BADGES = [
  { 
    id: 1, name: 'Top Rated Pro', 
    icon: Star, color: '#F59E0B',
    date: 'Jun 10, 2026', 
    description: 'Maintained a 4.8+ rating over 50 completed jobs.',
    bg: '#F59E0B18', border: '#F59E0B30'
  },
  { 
    id: 2, name: 'Lightning Fast', 
    icon: Zap, color: '#38BDF8',
    date: 'May 22, 2026', 
    description: 'Responded to 95% of requests in under 3 minutes.',
    bg: '#38BDF818', border: '#38BDF830'
  },
  { 
    id: 3, name: 'Century Club', 
    icon: Trophy, color: '#22C55E',
    date: 'Apr 15, 2026', 
    description: 'Successfully completed 100 service dispatches on VOLO.',
    bg: '#22C55E18', border: '#22C55E30'
  },
];

const UPCOMING_BADGES = [
  { 
    id: 4, name: 'Elite Professional', 
    icon: ShieldCheck, 
    progress: 75, 
    target: 'Maintain 95+ Score for 3 Months', 
    current: '2 months done'
  },
  { 
    id: 5, name: 'Veteran Partner', 
    icon: Award, 
    progress: 28, 
    target: 'Complete 500 Service Jobs', 
    current: '142 / 500'
  },
  { 
    id: 6, name: 'On Target', 
    icon: Target, 
    progress: 55, 
    target: 'Zero Cancellations for 30 Days', 
    current: '16 / 30 days'
  },
];

export default function WorkerBadgesPage() {
  const { data: dashboardData, isLoading } = useSWR('/api/worker/dashboard', fetcher);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#FF7A00]" />
          Badges & Achievements
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Unlock prestige badges by delivering exceptional service and reaching partner milestones.</p>
      </div>

      {/* Earned Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1 select-none">
          <Star className="h-4 w-4 text-[#FF7A00]" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Earned Badges</span>
          <span className="ml-auto text-[9px] font-black text-[#FF7A00] bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
            {EARNED_BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EARNED_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div 
                key={badge.id} 
                className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 text-center relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
                style={{ '--badge-color': badge.color } as React.CSSProperties}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at top right, ${badge.bg} 0%, transparent 60%)` }}
                />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div 
                    className="h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                    style={{ backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: badge.color }} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="font-black text-sm text-white leading-tight">{badge.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{badge.description}</p>
                  </div>
                  
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl"
                    style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
                  >
                    Earned {badge.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1 select-none">
          <Lock className="h-4 w-4 text-slate-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Next Achievements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UPCOMING_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div 
                key={badge.id} 
                className="bg-[#0F172A] border border-white/[0.04] rounded-3xl p-5 shadow-lg group hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 grayscale opacity-40 group-hover:opacity-60 transition-opacity">
                    <Icon className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-xs text-slate-300 leading-tight">{badge.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{badge.target}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Progress</span>
                    <span className="text-[9px] font-black text-slate-300 font-mono">{badge.current}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF7A00]/60 to-[#FF7A00] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[9px] font-black text-[#FF7A00]">{badge.progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
