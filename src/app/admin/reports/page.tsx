'use client';
 
import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import ExportCsvButton from '@/components/admin/shared/ExportCsvButton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  CalendarCheck,
  HardHat,
  Wrench,
  DollarSign,
  Activity,
  Star,
  Users
} from 'lucide-react';
 
const COLORS = ['#FF8A00', '#10B981', '#3B82F6', '#F59E0B', '#64748B', '#A855F7', '#06B6D4'];
 
export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'revenue' | 'bookings' | 'workers' | 'services'>('revenue');
  const [loading, setLoading] = useState(true);
 
  // Report Data States
  const [revenueData, setRevenueData] = useState<any>(null);
  const [bookingsData, setBookingsData] = useState<any>(null);
  const [workersData, setWorkersData] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any[]>([]);
 
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
 
  // Fetch report data based on active tab
  async function fetchReportData() {
    try {
      setLoading(true);
      if (activeTab === 'revenue') {
        const queryParams = new URLSearchParams();
        if (dateFrom) queryParams.set('date_from', dateFrom);
        if (dateTo) queryParams.set('date_to', dateTo);
        const res = await fetch(`/api/admin/reports/revenue?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch revenue analytics');
        const data = await res.json();
        setRevenueData(data);
      } else if (activeTab === 'bookings') {
        const res = await fetch('/api/admin/reports/bookings');
        if (!res.ok) throw new Error('Failed to fetch bookings analytics');
        const data = await res.json();
        setBookingsData(data);
      } else if (activeTab === 'workers') {
        const res = await fetch('/api/admin/reports/workers');
        if (!res.ok) throw new Error('Failed to fetch workers analytics');
        const data = await res.json();
        setWorkersData(data);
      } else if (activeTab === 'services') {
        const res = await fetch('/api/admin/reports/services');
        if (!res.ok) throw new Error('Failed to fetch services analytics');
        const data = await res.json();
        setServicesData(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateFrom, dateTo]);
 
  // Tab change handler
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setDateFrom('');
    setDateTo('');
  };
 
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none">Platform Analytics</h1>
          <p className="text-xs text-slate-450 select-none">
            Generate analytical logs, view visual metrics breakdown, and export data summaries.
          </p>
        </div>
      </div>
 
      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-[#1F2937]/50 pb-3 gap-2">
        <button
          onClick={() => handleTabChange('revenue')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'revenue'
              ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary'
              : 'bg-[#111827] border border-[#1F2937] text-slate-400 hover:bg-[#172033] hover:text-slate-200'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Revenue Reports
        </button>
        <button
          onClick={() => handleTabChange('bookings')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary'
              : 'bg-[#111827] border border-[#1F2937] text-slate-400 hover:bg-[#172033] hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          Booking Stats
        </button>
        <button
          onClick={() => handleTabChange('workers')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'workers'
              ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary'
              : 'bg-[#111827] border border-[#1F2937] text-slate-400 hover:bg-[#172033] hover:text-slate-200'
          }`}
        >
          <HardHat className="h-4 w-4" />
          Worker Rankings
        </button>
        <button
          onClick={() => handleTabChange('services')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary'
              : 'bg-[#111827] border border-[#1F2937] text-slate-400 hover:bg-[#172033] hover:text-slate-200'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Service Volume
        </button>
      </div>
 
      {/* REVENUE REPORT TAB */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-end justify-between gap-4 bg-[#111827] border border-[#1F2937] rounded-2xl p-4 shadow-md">
            <div className="flex gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-[#1F2937] bg-[#070B14] px-3.5 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-brand-primary/55 transition-colors h-[38px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-[#1F2937] bg-[#070B14] px-3.5 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-brand-primary/55 transition-colors h-[38px]"
                />
              </div>
            </div>
            <div>
              <ExportCsvButton
                data={revenueData?.time_series || []}
                filename={`revenue_report_${new Date().toISOString().slice(0, 10)}.csv`}
                disabled={loading || !revenueData?.time_series?.length}
              />
            </div>
          </div>
 
          {loading || !revenueData ? (
            <LoadingSkeleton rows={4} cols={4} />
          ) : (
            <div className="space-y-6">
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">
                    <span>Total Revenue</span>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    ₹{Number(revenueData.summary.total).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">
                    <span>Avg. Order Value</span>
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    ₹{Number(revenueData.summary.avg_per_booking).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">
                    <span>Admin Share (15%)</span>
                    <TrendingUp className="h-4 w-4 text-brand-primary" />
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    ₹{Number(revenueData.summary.admin_share).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">
                    <span>Worker Share (85%)</span>
                    <Users className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    ₹{Number(revenueData.summary.worker_share).toFixed(2)}
                  </p>
                </div>
              </div>
 
              {/* Chart */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2">Daily Revenue Flow</h3>
                <div className="h-80 w-full text-slate-400">
                  {revenueData.time_series.length > 0 ? (
                    mounted && (
                      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                        <LineChart data={revenueData.time_series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="period" stroke="#4b5563" fontSize={11} />
                          <YAxis stroke="#4b5563" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                          />
                          <Legend verticalAlign="top" height={36} iconSize={10} fontSize={11} />
                          <Line type="monotone" dataKey="total_revenue" name="Total Revenue (₹)" stroke="#FF8A00" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="admin_commission" name="Admin Commission (₹)" stroke="#F59E0B" strokeWidth={1.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold font-mono uppercase tracking-wider">
                      No revenue reports available for chosen date boundaries.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* BOOKINGS REPORT TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-end">
            <ExportCsvButton
              data={bookingsData?.by_status || []}
              filename={`bookings_by_status_${new Date().toISOString().slice(0, 10)}.csv`}
              disabled={loading || !bookingsData?.by_status?.length}
            />
          </div>
 
          {loading || !bookingsData ? (
            <LoadingSkeleton rows={4} cols={3} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cancellation metrics */}
              <div className="lg:col-span-4 bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-md flex flex-col justify-center space-y-4 text-center">
                <CalendarCheck className="h-10 w-10 text-brand-primary mx-auto" />
                <div>
                  <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">Cancellation Rate</h3>
                  <p className="text-4xl font-extrabold text-white mt-1 font-mono">
                    {bookingsData.cancellation_rate}%
                  </p>
                </div>
                <p className="text-[10px] text-slate-450 max-w-[200px] mx-auto leading-normal font-bold">
                  Ratio of cancelled requests vs historical aggregate logs.
                </p>
              </div>
 
              {/* Status Pie Chart */}
              <div className="lg:col-span-8 bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-md space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2">Status Breakdown</h3>
                <div className="h-72 w-full text-slate-400">
                  {bookingsData.by_status?.length > 0 ? (
                    mounted && (
                      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                        <PieChart>
                          <Pie
                            data={bookingsData.by_status}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {bookingsData.by_status.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconSize={10} fontSize={11} />
                        </PieChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold font-mono uppercase tracking-wider">
                      No status data records available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* WORKERS REPORT TAB */}
      {activeTab === 'workers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-end">
            <ExportCsvButton
              data={workersData?.top_by_jobs || []}
              filename={`top_workers_performance.csv`}
              disabled={loading || !workersData?.top_by_jobs?.length}
            />
          </div>
 
          {loading || !workersData ? (
            <LoadingSkeleton rows={4} cols={3} />
          ) : (
            <div className="space-y-6">
              {/* KYC Funnel summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md text-center space-y-1 relative">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">KYC Pending</span>
                  <p className="text-3xl font-black text-amber-500 font-mono">
                    {workersData.kyc_funnel.pending}
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md text-center space-y-1 relative">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">KYC Approved</span>
                  <p className="text-3xl font-black text-emerald-400 font-mono">
                    {workersData.kyc_funnel.approved}
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-md text-center space-y-1 relative">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">KYC Rejected</span>
                  <p className="text-3xl font-black text-red-500 font-mono">
                    {workersData.kyc_funnel.rejected}
                  </p>
                </div>
              </div>
 
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top by Jobs Table */}
                <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-brand-primary" />
                    Top Workers by Jobs Completed
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-[#070B14] text-slate-400 text-[10px] font-black uppercase tracking-wider font-mono">
                        <tr className="border-b border-[#1F2937]">
                          <th className="px-4 py-3">Partner Name</th>
                          <th className="px-4 py-3">Jobs Done</th>
                          <th className="px-4 py-3">Avg Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2937]/50 bg-[#111827]">
                        {workersData.top_by_jobs?.map((w: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#172033]/40 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-white uppercase">{w.name}</td>
                            <td className="px-4 py-3.5 font-black font-mono text-brand-primary">{w.jobs}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 font-mono font-black text-amber-500">
                                <Star className="h-3 w-3 fill-current" />
                                {Number(w.rating).toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
 
                {/* Top by Rating Table */}
                <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2 flex items-center gap-2">
                    <Star className="h-4.5 w-4.5 text-amber-500" />
                    Top Workers by Rating Score
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-[#070B14] text-slate-400 text-[10px] font-black uppercase tracking-wider font-mono">
                        <tr className="border-b border-[#1F2937]">
                          <th className="px-4 py-3">Partner Name</th>
                          <th className="px-4 py-3">Rating</th>
                          <th className="px-4 py-3">Total Jobs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2937]/50 bg-[#111827]">
                        {workersData.top_by_rating?.map((w: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#172033]/40 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-white uppercase">{w.name}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-550 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                                <Star className="h-3 w-3 fill-current" />
                                {Number(w.rating).toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-black font-mono text-slate-400">{w.jobs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* SERVICES REPORT TAB */}
      {activeTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-end">
            <ExportCsvButton
              data={servicesData.map((s) => ({
                ID: s.id,
                'Service Name': s.name,
                'Bookings Count': s.bookings_count,
                'Earning Volume': s.revenue
              }))}
              filename={`services_popularity_report.csv`}
              disabled={loading || servicesData.length === 0}
            />
          </div>
 
          {loading ? (
            <LoadingSkeleton rows={4} cols={4} />
          ) : servicesData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Popularity Bar Chart */}
              <div className="lg:col-span-7 bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2">Service Popularity Volumes</h3>
                <div className="h-80 w-full text-slate-400">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <BarChart data={servicesData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickFormatter={(v) => v.slice(0, 8)} />
                        <YAxis stroke="#4b5563" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                        />
                        <Bar dataKey="bookings_count" name="Bookings Count" fill="#FF8A00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
 
              {/* Detail Table */}
              <div className="lg:col-span-5 bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-[#1F2937] pb-2 flex items-center gap-1.5">
                  <Wrench className="h-4.5 w-4.5 text-brand-primary" />
                  Service Earnings rankings
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-[#070B14] text-slate-400 text-[10px] font-black uppercase tracking-wider font-mono">
                      <tr className="border-b border-[#1F2937]">
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Bookings</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937]/50 bg-[#111827]">
                      {servicesData.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-[#172033]/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-white uppercase">{s.name}</td>
                          <td className="px-4 py-3 font-black font-mono text-brand-primary">{s.bookings_count}</td>
                          <td className="px-4 py-3 text-right font-black font-mono text-emerald-400">
                            ₹{Number(s.revenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wider bg-[#111827] border border-[#1F2937] rounded-2xl">
              No service booking logs recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
