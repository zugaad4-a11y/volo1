'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  DollarSign, Clock, Calendar, BarChart3, Loader2, 
  AlertCircle, IndianRupee, Briefcase, Percent
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type PeriodTab = 'today' | 'week' | 'month' | 'custom';

export default function WorkerEarningsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = new URLSearchParams({
    period: activePeriod,
    date_from: dateFrom,
    date_to: dateTo
  });

  const { data, error, isLoading } = useSWR(`/api/worker/earnings?${queryParams.toString()}`, fetcher);

  const handlePeriodChange = (period: PeriodTab) => {
    setActivePeriod(period);
    if (period !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#FF7A00]" />
          Earnings Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Track your completed allocations, platform service shares, and aggregate payouts.</p>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Consolidating financial reports...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl text-center text-xs text-red-400 font-bold shadow">
          Failed to load earnings metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Filter Controls and Summary metrics cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Period Selector Tabs */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest block pl-1 select-none">Select Range</span>
              
              <div className="flex border border-white/[0.08] p-1 bg-[#070B14]/60 rounded-2xl select-none">
                {(['today', 'week', 'month', 'custom'] as PeriodTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handlePeriodChange(tab)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activePeriod === tab
                        ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/25 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              {activePeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in-up">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest pl-1">Start Date</span>
                    <input
                      type="date"
                      value={dateFrom}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-white outline-none font-mono transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest block pl-1">End Date</span>
                    <input
                      type="date"
                      value={dateTo}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-white outline-none font-mono transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Earnings Analytics Grid */}
            <div className="grid grid-cols-2 gap-3 select-none">
              
              <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4.5 shadow-lg flex flex-col justify-between min-h-[100px] group hover:border-[#FF7A00]/30 transition-all duration-350">
                <div className="flex items-center gap-2">
                  <div className="h-7 -ml-0.5 w-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF7A00]">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Net Earnings</span>
                </div>
                <div className="mt-3">
                  <p className="text-base font-black text-white group-hover:text-[#FF7A00] transition-colors">₹{(data.summary?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Technician share</span>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4.5 shadow-lg flex flex-col justify-between min-h-[100px] group hover:border-sky-500/30 transition-all duration-350">
                <div className="flex items-center gap-2">
                  <div className="h-7 -ml-0.5 w-7 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Completed</span>
                </div>
                <div className="mt-3">
                  <p className="text-base font-black text-white group-hover:text-[#0EA5E9] transition-colors">{data.summary?.jobsCount || 0} Jobs</p>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Dispatches completed</span>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4.5 shadow-lg flex flex-col justify-between min-h-[100px] group hover:border-red-500/30 transition-all duration-350">
                <div className="flex items-center gap-2">
                  <div className="h-7 -ml-0.5 w-7 rounded-xl bg-red-500/10 flex items-center justify-center text-[#EF4444]">
                    <Percent className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Commissions</span>
                </div>
                <div className="mt-3">
                  <p className="text-base font-black text-white group-hover:text-red-400 transition-colors">₹{(data.summary?.commission || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">15% platform cut</span>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-4.5 shadow-lg flex flex-col justify-between min-h-[100px] group hover:border-emerald-500/30 transition-all duration-350">
                <div className="flex items-center gap-2">
                  <div className="h-7 -ml-0.5 w-7 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
                    <IndianRupee className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Avg Job</span>
                </div>
                <div className="mt-3">
                  <p className="text-base font-black text-white group-hover:text-[#22C55E] transition-colors">₹{(data.summary?.average || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Net avg yield</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Trend Graph Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 select-none">
                <Calendar className="h-4.5 w-4.5 text-[#FF7A00]" />
                <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Earnings Trend Graph</h3>
              </div>
              
              {data.chartData && data.chartData.length > 0 ? (
                <div className="h-72 w-full mt-4">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <AreaChart
                        data={data.chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="earningsTrendGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#FF7A00" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="label" 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={9} 
                          tickLine={false} 
                          dy={8}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={9} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F172A', 
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            fontSize: '11px',
                            color: 'white'
                          }}
                          labelClassName="text-slate-400"
                          itemStyle={{ color: '#FF7A00', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#FF7A00" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#earningsTrendGlow)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-slate-500 font-semibold italic">
                  No data points found to plot for this selection.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
