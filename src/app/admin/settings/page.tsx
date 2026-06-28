'use client';
 
import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import { Settings, ShieldAlert, Save, RefreshCw, Landmark, Sliders } from 'lucide-react';
 
export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
 
  // Settings states
  const [commissionRate, setCommissionRate] = useState('15');
  const [workerShareRate, setWorkerShareRate] = useState('85');
  const [searchRadiusKm, setSearchRadiusKm] = useState('10');
  const [assignmentTimeoutSec, setAssignmentTimeoutSec] = useState('120');
  const [settlementDay, setSettlementDay] = useState('0');
  const [settlementTimeUtc, setSettlementTimeUtc] = useState('16:30');
  const [minCodWalletBalance, setMinCodWalletBalance] = useState('500');
  const [maxOtpAttempts, setMaxOtpAttempts] = useState('5');
 
  // Fetch settings from API
  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load platform settings');
      const data = await res.json();
      
      if (data.commission_rate) setCommissionRate(data.commission_rate);
      if (data.worker_share_rate) setWorkerShareRate(data.worker_share_rate);
      if (data.search_radius_km) setSearchRadiusKm(data.search_radius_km);
      if (data.assignment_timeout_sec) setAssignmentTimeoutSec(data.assignment_timeout_sec);
      if (data.settlement_day) setSettlementDay(data.settlement_day);
      if (data.settlement_time_utc) setSettlementTimeUtc(data.settlement_time_utc);
      if (data.min_cod_wallet_balance) setMinCodWalletBalance(data.min_cod_wallet_balance);
      if (data.max_otp_attempts) setMaxOtpAttempts(data.max_otp_attempts);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching settings.');
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchSettings();
  }, []);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
 
    // Validations
    const comm = parseFloat(commissionRate);
    const share = parseFloat(workerShareRate);
    if (isNaN(comm) || isNaN(share) || comm + share !== 100) {
      setError('Earning Share mismatch: Commission Rate (%) and Worker Share Rate (%) must add up to exactly 100%.');
      return;
    }
 
    try {
      setSaving(true);
      const payload = {
        commission_rate: commissionRate,
        worker_share_rate: workerShareRate,
        search_radius_km: searchRadiusKm,
        assignment_timeout_sec: assignmentTimeoutSec,
        settlement_day: settlementDay,
        settlement_time_utc: settlementTimeUtc,
        min_cod_wallet_balance: minCodWalletBalance,
        max_otp_attempts: maxOtpAttempts,
      };
 
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
 
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update platform settings');
      }
 
      setSuccess('Platform configurations updated successfully and recorded in audit logs.');
      await fetchSettings();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while saving configurations.');
    } finally {
      setSaving(false);
    }
  };
 
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
          <p className="text-xs text-slate-400">Loading configurations...</p>
        </div>
        <LoadingSkeleton rows={5} cols={3} />
      </div>
    );
  }
 
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none flex items-center gap-2.5">
            <Settings className="w-6.5 h-6.5 text-brand-primary" />
            Platform Configuration
          </h1>
          <p className="text-xs text-slate-450 select-none font-medium">
            Configure system rules, payment commission divisions, dispatch boundaries, and security parameters.
          </p>
        </div>
      </div>
 
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-2xl text-xs text-red-400 flex items-start gap-2.5 shadow-md">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wide">Validation Error</span>
            <p className="font-medium text-red-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
 
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl text-xs text-emerald-400 font-bold uppercase tracking-wider font-mono">
          {success}
        </div>
      )}
 
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Financial Settings */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-lg space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest pb-3 border-b border-[#1F2937] flex items-center gap-2 font-mono">
            <Sliders className="h-4.5 w-4.5 text-brand-primary" />
            Commission &amp; Financial Settings
          </h3>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Platform Commission (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Percentage deducted from booking amount for platform administration costs.
              </span>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Worker Earning Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={workerShareRate}
                onChange={(e) => setWorkerShareRate(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Percentage of booking amount distributed directly to the partner wallet.
              </span>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Min COD Wallet Reserve (₹)</label>
              <input
                type="number"
                min="0"
                value={minCodWalletBalance}
                onChange={(e) => setMinCodWalletBalance(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Minimum wallet balance required by worker to accept cash bookings.
              </span>
            </div>
          </div>
 
          <h3 className="text-xs font-black text-white uppercase tracking-widest pb-3 border-b border-[#1F2937] pt-4 font-mono">
            Routing &amp; Security Controls
          </h3>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Default Dispatch Radius (km)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Haversine coordinate perimeter used for finding active nearby workers.
              </span>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Assignment Timeout (seconds)</label>
              <input
                type="number"
                min="30"
                max="3600"
                value={assignmentTimeoutSec}
                onChange={(e) => setAssignmentTimeoutSec(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Duration before an unanswered job request cascades to the next worker.
              </span>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Max Login OTP Guesses</label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxOtpAttempts}
                onChange={(e) => setMaxOtpAttempts(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-bold font-mono"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Maximum consecutive incorrect OTP entries allowed before account lock out.
              </span>
            </div>
          </div>
 
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-400 bg-transparent border border-[#1F2937] hover:bg-[#172033] rounded-xl transition-all cursor-pointer select-none active:scale-95 duration-150"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Config
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary/40 rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/10 select-none active:scale-95 duration-150"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving Config...' : 'Save Settings'}
            </button>
          </div>
        </div>
 
        {/* Payout & Settlement Info Panel */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-lg space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest pb-3 border-b border-[#1F2937] flex items-center gap-2 font-mono">
            <Landmark className="h-4.5 w-4.5 text-brand-primary" />
            Payout Schedule
          </h3>
 
          <div className="space-y-4 text-xs text-slate-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Weekly Settlement Run Day</label>
              <select
                value={settlementDay}
                onChange={(e) => setSettlementDay(e.target.value)}
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-brand-primary/55 transition-all font-semibold"
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                The day of the week automated settlement ledger batches trigger.
              </span>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Settlement Trigger Time (UTC)</label>
              <input
                type="text"
                value={settlementTimeUtc}
                onChange={(e) => setSettlementTimeUtc(e.target.value)}
                placeholder="16:30"
                className="w-full rounded-xl border border-[#1F2937] bg-[#070B14] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-primary/55 transition-colors font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 font-medium leading-normal block">
                Trigger time in 24-hour UTC format (e.g. 16:30 UTC represents 22:00 IST).
              </span>
            </div>
 
            <div className="p-4.5 bg-[#070B14]/60 rounded-2xl border border-[#1F2937] leading-relaxed space-y-2 text-slate-400 text-xs">
              <span className="font-black text-brand-primary block uppercase tracking-wider font-mono text-[10px]">Automated Settlements Info</span>
              <p className="font-semibold text-slate-400/95 leading-normal">
                Weekly worker earnings are aggregated into settlement ledger sheets. The pg_cron backend initiates automated RazorpayX payouts to verified bank accounts.
              </p>
              <p className="font-bold text-slate-600 text-[9px] font-mono uppercase tracking-wider">
                Note: Updating pg_cron schedule requires database admin supervisor credentials.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
