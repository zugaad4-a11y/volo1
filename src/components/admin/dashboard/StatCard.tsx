'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  color?: 'violet' | 'emerald' | 'rose' | 'amber' | 'blue';
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  description,
  color = 'violet',
  trend,
}: StatCardProps) {
  const colorMap = {
    violet: 'text-[#FF8A00] bg-[#FF8A00]/10 border-[#FF8A00]/20 shadow-[0_0_12px_rgba(255,138,0,0.1)]',
    rose: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]',
    emerald: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]',
    amber: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]',
    blue: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]',
  };

  const trendColor = trend
    ? trend.isPositive
      ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20'
      : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
    : '';

  return (
    <div className="bg-[#111827] border border-[#1F2937] hover:border-[#FF8A00]/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-black/45 flex items-center justify-between gap-5 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in group select-none relative overflow-hidden">
      {/* Background design glow */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#FF8A00]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF8A00]/10 transition-colors duration-300" />
      
      <div className="space-y-2.5 min-w-0 flex-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block font-mono">{title}</span>
        <h3 className="text-2xl font-black text-white tracking-tight font-display truncate leading-none">{value}</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[9px] font-black font-mono uppercase ${trendColor}`}>
              {trend.isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {trend.value}
            </span>
          )}
          {description && (
            <p className="text-[10px] text-slate-450 font-bold tracking-tight truncate leading-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        {icon && (
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${colorMap[color]}`}>
            {icon}
          </div>
        )}
        
        {/* SVG Sparkline for Premium visual chart indicator */}
        <div className="no-print opacity-70 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="h-6 w-16 text-[#FF8A00]" viewBox="0 0 100 30">
            <path
              d={
                trend?.isPositive 
                  ? "M 0 25 Q 15 15 35 20 T 70 8 T 100 5" 
                  : "M 0 5 Q 15 12 35 10 T 70 22 T 100 28"
              }
              fill="none"
              stroke={trend?.isPositive ? "#22C55E" : "#EF4444"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
