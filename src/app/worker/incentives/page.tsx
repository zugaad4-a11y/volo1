'use client';

import React, { useState } from 'react';
import { Gift, CheckCircle2, Clock, AlertCircle, Zap, Trophy } from 'lucide-react';

const AVAILABLE_INCENTIVES = [
  { id: 1, rule: 'Weekend Warrior', description: 'Complete 10 jobs this weekend to unlock a bonus payout.', target: 10, current: 6, reward: '₹1,500', endsIn: '2 days', color: '#22C55E' },
  { id: 2, rule: 'Flawless 5', description: 'Get five consecutive 5-star ratings from customers.', target: 5, current: 3, reward: '₹500', endsIn: 'Ongoing', color: '#F59E0B' },
];

const INCENTIVE_HISTORY = [
  { id: 101, rule: 'First 50 Jobs', reward: '₹2,000', status: 'PAID', date: 'May 10, 2026' },
  { id: 102, rule: 'Festival Bonus', reward: '₹1,000', status: 'APPROVED', date: 'Jun 12, 2026' },
  { id: 103, rule: 'Perfect Attendance (May)', reward: '₹750', status: 'PENDING', date: 'Jun 01, 2026' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PAID':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20"><CheckCircle2 className="h-2.5 w-2.5" />Paid</span>;
    case 'APPROVED':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-sky-500/10 text-[#38BDF8] border border-sky-500/20"><CheckCircle2 className="h-2.5 w-2.5" />Approved</span>;
    case 'PENDING':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 animate-pulse"><Clock className="h-2.5 w-2.5" />Pending</span>;
    default:
      return <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06]">{status}</span>;
  }
};

export default function WorkerIncentivesPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const totalEarned = INCENTIVE_HISTORY.reduce((sum, i) => {
    const amount = parseInt(i.reward.replace(/[^0-9]/g, ''));
    return sum + (i.status === 'PAID' ? amount : 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#FF7A00]" />
              Incentives & Rewards
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Track active bonus challenges, progress milestones, and payout history.</p>
          </div>
          <div className="shrink-0 text-right bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider block">Total Earned</span>
            <span className="text-lg font-black text-white">₹{totalEarned.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-white/[0.08] p-1 bg-[#0F172A]/60 backdrop-blur-md rounded-2xl select-none max-w-sm">
        {(['available', 'history'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/25 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'available' ? 'Active Incentives' : 'Reward History'}
          </button>
        ))}
      </div>

      {/* Available Incentives */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {AVAILABLE_INCENTIVES.length === 0 ? (
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-12 text-center select-none space-y-3">
              <Gift className="h-10 w-10 text-slate-700 mx-auto" />
              <p className="text-sm font-black text-slate-400">No Active Incentives</p>
              <p className="text-xs text-slate-500 font-semibold">Check back later for new bonus challenges.</p>
            </div>
          ) : (
            AVAILABLE_INCENTIVES.map((incentive) => {
              const progressPercent = Math.round((incentive.current / incentive.target) * 100);
              return (
                <div
                  key={incentive.id}
                  className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl hover:border-white/[0.15] transition-all duration-300 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 right-0 h-32 w-32 blur-[60px] rounded-full opacity-30 pointer-events-none"
                    style={{ backgroundColor: incentive.color }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${incentive.color}18`, border: `1px solid ${incentive.color}30` }}
                        >
                          <Zap className="h-5 w-5" style={{ color: incentive.color }} />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-white">{incentive.rule}</h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">{incentive.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black" style={{ color: incentive.color }}>{incentive.reward}</span>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">Ends: {incentive.endsIn}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        <span>Progress</span>
                        <span className="text-slate-300 font-mono">{incentive.current} / {incentive.target}</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${progressPercent}%`, backgroundColor: incentive.color }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[9px] font-black" style={{ color: incentive.color }}>{progressPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl">
          {/* Header Row */}
          <div className="grid grid-cols-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.06]">
            {['Incentive', 'Status', 'Date', 'Amount'].map((h, i) => (
              <span key={h} className={`text-[9px] font-black uppercase tracking-wider text-slate-500 ${i === 3 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {INCENTIVE_HISTORY.map((item) => (
              <div key={item.id} className="grid grid-cols-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="h-3.5 w-3.5 text-[#FF7A00] shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{item.rule}</span>
                </div>
                {getStatusBadge(item.status)}
                <span className="text-[10px] text-slate-500 font-mono font-semibold">{item.date}</span>
                <span className="text-xs font-black text-[#22C55E] text-right">{item.reward}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
