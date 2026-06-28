'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Calendar, Clock, Check, Power, Loader2, Save, 
  AlertCircle, CheckCircle2, Plus, Trash2, CalendarDays
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function WorkerAvailabilityPage() {
  const { data: availData, error, isLoading } = useSWR('/api/worker/availability', fetcher);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [vacationMode, setVacationMode] = useState(false);
  
  // Custom date exclusion state
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [newDateInput, setNewDateInput] = useState('');

  useEffect(() => {
    if (availData) {
      setSelectedDays(availData.working_days || []);
      setStartTime((availData.start_time || '09:00:00').substring(0, 5));
      setEndTime((availData.end_time || '18:00:00').substring(0, 5));
      setVacationMode(!!availData.vacation_mode);
      setUnavailableDates(availData.unavailable_dates || []);
    }
  }, [availData]);

  const handleToggleDay = (day: string) => {
    if (vacationMode) return;
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddUnavailableDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;

    if (unavailableDates.includes(newDateInput)) {
      setErrorMsg('This date is already listed.');
      return;
    }

    setUnavailableDates(prev => [...prev, newDateInput].sort());
    setNewDateInput('');
    setErrorMsg('');
  };

  const handleRemoveUnavailableDate = (dateToRemove: string) => {
    setUnavailableDates(prev => prev.filter(d => d !== dateToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_days: selectedDays,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          vacation_mode: vacationMode,
          unavailable_dates: unavailableDates
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update availability.');

      setSuccessMsg('Availability parameters saved successfully.');
      mutate('/api/worker/availability');
      mutate('/api/worker/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider animate-pulse">Syncing schedule...</p>
      </div>
    );
  }

  if (error || !availData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-lg shadow-red-500/5">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-white">Failed to load Schedule</h3>
        <p className="text-xs text-slate-400 leading-relaxed">There was a problem loading your availability details. Please try refreshing.</p>
        <button
          type="button"
          onClick={() => mutate('/api/worker/availability')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white hover:bg-[#EF4444] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#FF7A00]" />
          Availability & Shift Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Configure operational weekdays, shift time intervals, or request vacation leave.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Desktop Responsive Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Vacation State and Active Days */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Vacation Mode Toggle */}
            <div className={`bg-[#0F172A] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 ${
              vacationMode ? 'border-[#F59E0B]/50 shadow-[#F59E0B]/2 bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#F59E0B]/5' : 'border-white/[0.08]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${vacationMode ? 'bg-[#F59E0B] animate-pulse' : 'bg-slate-650'}`} />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Vacation Mode: {vacationMode ? 'ON' : 'OFF'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-450 leading-relaxed max-w-md">
                    {vacationMode 
                      ? 'Vacation is active. Operational dispatches are paused, and you will not be offered incoming client orders.' 
                      : 'Active shift mode. You are eligible to receive booking requests during operating hours.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setVacationMode(!vacationMode)}
                  className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 border focus:outline-none ${
                    vacationMode 
                      ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50' 
                      : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <span className="sr-only">Toggle Vacation Mode</span>
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-300 flex items-center justify-center ${
                      vacationMode 
                        ? 'translate-x-9 bg-[#F59E0B] shadow-md shadow-[#F59E0B]/40' 
                        : 'translate-x-1.5 bg-slate-500'
                    }`}
                  >
                    <Power className="h-2.5 w-2.5 text-white" />
                  </span>
                </button>
              </div>
            </div>

            {/* Operating Weekdays Selection */}
            <div className={`bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4 transition-opacity duration-300 ${
              vacationMode ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 select-none">
                <Calendar className="h-4 w-4 text-[#FF7A00]" />
                <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Weekly Operating Days</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WEEKDAYS.map(day => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      disabled={vacationMode}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-black transition-all duration-200 select-none cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30 text-[#FF7A00] shadow-sm'
                          : 'bg-[#070B14]/40 border-white/[0.04] text-slate-400 hover:bg-[#070B14] hover:text-slate-200'
                      }`}
                    >
                      {day}
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#FF7A00]" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Time range shift hours and Custom Leaves */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Daily Time Range Selection */}
            <div className={`bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4 transition-opacity duration-300 ${
              vacationMode ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 select-none">
                <Clock className="h-4 w-4 text-[#FF7A00]" />
                <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Shift Timing Intervals</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block pl-1">Shift Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={vacationMode}
                    className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-3 text-xs text-white font-extrabold outline-none disabled:opacity-40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block pl-1">Shift End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={vacationMode}
                    className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-3 text-xs text-white font-extrabold outline-none disabled:opacity-40 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Date Exclusions */}
            <div className={`bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4 transition-opacity duration-300 ${
              vacationMode ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 select-none">
                <CalendarDays className="h-4 w-4 text-[#FF7A00]" />
                <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Leave exclusions</h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDateInput}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  disabled={vacationMode}
                  className="flex-1 bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-200 outline-none disabled:opacity-40 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddUnavailableDate}
                  disabled={vacationMode || !newDateInput}
                  className="bg-[#070B14] hover:bg-[#070B14]/80 border border-white/[0.08] hover:border-white/[0.15] px-5 py-2.5 rounded-2xl text-xs font-black transition-all text-[#FF7A00] flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-30"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add
                </button>
              </div>

              {unavailableDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2 select-none max-h-36 overflow-y-auto no-scrollbar">
                  {unavailableDates.map(dateStr => (
                    <span 
                      key={dateStr}
                      className="inline-flex items-center gap-2 bg-[#070B14] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs font-bold text-slate-350"
                    >
                      {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {!vacationMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnavailableDate(dateStr)}
                          className="text-slate-550 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic font-semibold text-center py-2 select-none">No leave dates specified.</p>
              )}
            </div>

          </div>

        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold shadow">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-550" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold shadow">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
            {successMsg}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2 select-none max-w-xs mx-auto w-full">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF9E43] text-white py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-98 cursor-pointer disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Saving Schedule...
              </>
            ) : (
              <>
                <Save className="h-4.5 w-4.5" />
                Save Settings
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
