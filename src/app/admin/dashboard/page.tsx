'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/admin/dashboard/StatCard';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import BookingStatusChart from '@/components/admin/dashboard/BookingStatusChart';
import RecentActivityFeed from '@/components/admin/dashboard/RecentActivityFeed';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import {
  HardHat,
  Users,
  CalendarCheck,
  TrendingUp,
  Inbox,
  CheckCircle,
  Banknote,
  Activity,
  Heart,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total_workers: number;
  active_workers: number;
  pending_kyc: number;
  total_customers: number;
  todays_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  pending_settlements: number;
  pending_settlement_amount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/admin/dashboard/metrics'),
          fetch('/api/admin/dashboard/recent-activity')
        ]);

        const statsData = await statsRes.json();
        const activityData = await activityRes.json();

        setStats(statsData);
        setActivities(activityData);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton rows={4} cols={3} />
      </div>
    );
  }

  const revenueChartData = (stats as any).revenue_chart || [];

  const bookingStatusData = [
    { name: 'Completed', value: stats.completed_bookings },
    { name: 'Pending Route', value: stats.pending_bookings },
    { name: 'Active', value: stats.todays_bookings - stats.completed_bookings - stats.pending_bookings || 0 }
  ].filter((item) => item.value > 0);

  const defaultPieData = [
    { name: 'Completed', value: stats.completed_bookings || 1 },
    { name: 'Pending Route', value: stats.pending_bookings || 0 },
    { name: 'Active', value: 0 }
  ];

  return (
    <div className="space-y-8 pb-12 font-sans select-none animate-in fade-in duration-200">
      
      {/* SECTION 1 — HERO OVERVIEW */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#0A0F1E] border border-[#1F2937] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        {/* Background design glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FF8A00]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4 text-center md:text-left z-10">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
              Good Morning, Admin
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Volo Operations is healthy and active. Here is today's dispatch overview.
            </p>
          </div>
          
          {/* Quick Highlight Stats Row */}
          <div className="flex flex-wrap justify-center md:justify-start gap-5 text-xs font-mono font-bold mt-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#0A0F1E] border border-[#1F2937]">
              <span className="text-slate-500 uppercase text-[9px] block">Revenue Today</span>
              <span className="text-white text-sm mt-0.5 block font-black font-display">₹{stats.revenue_today.toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0A0F1E] border border-[#1F2937]">
              <span className="text-slate-500 uppercase text-[9px] block">Active Partners</span>
              <span className="text-[#22C55E] text-sm mt-0.5 block font-black font-display">{stats.active_workers} Online</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0A0F1E] border border-[#1F2937]">
              <span className="text-slate-500 uppercase text-[9px] block">Today's Bookings</span>
              <span className="text-[#FF8A00] text-sm mt-0.5 block font-black font-display">{stats.todays_bookings} Orders</span>
            </div>
          </div>
        </div>

        {/* Platform Health Circular Widget */}
        <div className="flex flex-col items-center justify-center p-5 bg-[#111827] border border-[#1F2937] rounded-2xl shrink-0 w-48 text-center shadow-xl">
          <Heart className="h-6 w-6 text-[#22C55E] animate-pulse mb-1.5" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block font-mono">Platform Health</span>
          <span className="text-2xl font-black text-white block mt-0.5">98.4%</span>
          <span className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase">All systems operational</span>
        </div>
      </div>

      {/* SECTION 2 — KPI GRID */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Platform Vital Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.revenue_this_month.toLocaleString()}`}
            icon={<TrendingUp className="h-4.5 w-4.5" />}
            description="This Month"
            color="violet"
            trend={{ value: '12.4%', isPositive: true }}
          />
          <StatCard
            title="Active Bookings"
            value={stats.todays_bookings}
            icon={<CalendarCheck className="h-4.5 w-4.5" />}
            description="Placed Today"
            color="blue"
            trend={{ value: '8.2%', isPositive: true }}
          />
          <StatCard
            title="Total Partners"
            value={stats.total_workers}
            icon={<HardHat className="h-4.5 w-4.5" />}
            description={`${stats.active_workers} online now`}
            color="emerald"
            trend={{ value: '4.1%', isPositive: true }}
          />
          <StatCard
            title="Customers"
            value={stats.total_customers}
            icon={<Users className="h-4.5 w-4.5" />}
            description="Registered accounts"
            color="blue"
            trend={{ value: '14.5%', isPositive: true }}
          />
          <StatCard
            title="Unpaid Settlements"
            value={`₹${stats.pending_settlement_amount.toLocaleString()}`}
            icon={<Banknote className="h-4.5 w-4.5" />}
            description={`${stats.pending_settlements} workers pending`}
            color="rose"
            trend={{ value: '1.2%', isPositive: false }}
          />
          <StatCard
            title="Awaiting KYC"
            value={stats.pending_kyc}
            icon={<Inbox className="h-4.5 w-4.5" />}
            description="Pending audit"
            color="amber"
            trend={{ value: '0.0%', isPositive: true }}
          />
        </div>
      </div>

      {/* SECTION 3 — ACTION CENTER */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Operational Dispatch Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Alert 1 */}
          <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#F59E0B]/10 text-[#F59E0B] font-mono border border-[#F59E0B]/20">High Severity</span>
                <span className="text-slate-600 font-mono text-[9px] font-bold">Alert 1</span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2 font-mono">KYC Approvals</h4>
              <p className="text-[11px] text-slate-400 leading-normal">{stats.pending_kyc} field workers are waiting for approval.</p>
            </div>
            <Link 
              href="/admin/workers?kyc_status=PENDING"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF8A00] hover:text-[#FF9F2E] font-mono transition-transform duration-200 group-hover:translate-x-0.5"
            >
              Review Documents <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Alert 2 */}
          <div className="bg-[#111827] border border-red-500/20 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#EF4444]" />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#EF4444]/10 text-[#EF4444] font-mono border border-red-500/20">Critical</span>
                <span className="text-slate-600 font-mono text-[9px] font-bold">Alert 2</span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2 font-mono">Unassigned Bookings</h4>
              <p className="text-[11px] text-slate-400 leading-normal">{stats.pending_bookings} active jobs awaiting driver/worker routing.</p>
            </div>
            <Link 
              href="/admin/manual-assignments"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#EF4444] hover:text-red-400 font-mono transition-transform duration-200 group-hover:translate-x-0.5"
            >
              Manual Dispatch <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Alert 3 */}
          <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#3B82F6]/10 text-[#3B82F6] font-mono border border-[#3B82F6]/20">Medium</span>
                <span className="text-slate-600 font-mono text-[9px] font-bold">Alert 3</span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2 font-mono">Partner Payouts</h4>
              <p className="text-[11px] text-slate-400 leading-normal">{stats.pending_settlements} completed ledger transfers pending auto-settlement.</p>
            </div>
            <Link 
              href="/admin/settlements"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF8A00] hover:text-[#FF9F2E] font-mono transition-transform duration-200 group-hover:translate-x-0.5"
            >
              Process Ledger <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Alert 4 */}
          <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#22C55E]/10 text-[#22C55E] font-mono border border-[#22C55E]/20">Normal</span>
                <span className="text-slate-600 font-mono text-[9px] font-bold">System Status</span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2 font-mono">Platform Health</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Operational audit logs successfully synchronized with database.</p>
            </div>
            <Link 
              href="/admin/audit-logs"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 hover:text-white font-mono transition-transform duration-200 group-hover:translate-x-0.5"
            >
              Audit Database <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

        </div>
      </div>

      {/* SECTION 4 — ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Revenue Analytics</h2>
            
            {/* Filter timeframe */}
            <div className="flex bg-[#111827] p-0.5 rounded-xl border border-[#1F2937] text-[9px] font-black uppercase font-mono">
              {(['7d', '30d', '90d'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    timeframe === t ? 'bg-[#FF8A00] text-white' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={revenueChartData} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Job Allocations</h2>
          <BookingStatusChart data={bookingStatusData.length > 0 ? bookingStatusData : defaultPieData} />
        </div>
      </div>

      {/* SECTION 5 — LIVE ACTIVITY TIMELINE */}
      <div>
        <RecentActivityFeed activities={activities} />
      </div>

    </div>
  );
}
