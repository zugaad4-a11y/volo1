'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, Shield, LogOut, Trash2, Loader2, 
  CheckCircle2, AlertTriangle, Volume2, Mail, Info 
} from 'lucide-react';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-300 border focus:outline-none cursor-pointer ${
        value ? 'bg-[#FF7A00]/20 border-[#FF7A00]/50' : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-300 shadow-sm ${
          value ? 'translate-x-7 bg-[#FF7A00] shadow-orange-500/40' : 'translate-x-1 bg-slate-500'
        }`}
      />
    </button>
  );
}

export default function WorkerSettingsPage() {
  const router = useRouter();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const [deactivating, setDeactivating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  useEffect(() => {
    const soundPref = localStorage.getItem('volo_worker_sound_pref');
    const emailPref = localStorage.getItem('volo_worker_email_pref');
    if (soundPref !== null) setSoundEnabled(soundPref === 'true');
    if (emailPref !== null) setEmailEnabled(emailPref === 'true');
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('volo_worker_sound_pref', String(soundEnabled));
    localStorage.setItem('volo_worker_email_pref', String(emailEnabled));
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/worker/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    setDeactivateError('');
    try {
      const res = await fetch('/api/worker/profile', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate account.');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/worker/login');
    } catch (err: any) {
      setDeactivateError(err.message || 'Error deactivating account.');
      setDeactivating(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#FF7A00]" />
          Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Configure sound alerts, dispatch notifications, and manage account security.</p>
      </div>

      {/* Preferences Panel */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 select-none">
          <Bell className="h-4 w-4 text-[#FF7A00]" />
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Preferences</h3>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Volume2 className="h-4 w-4 text-[#FF7A00]" />
                Sound Alerts
              </label>
              <span className="text-[10px] text-slate-500 block leading-tight">Play audio chime when a new dispatch job arrives</span>
            </div>
            <Toggle value={soundEnabled} onChange={setSoundEnabled} />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-5">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Mail className="h-4 w-4 text-[#FF7A00]" />
                Email Reports
              </label>
              <span className="text-[10px] text-slate-500 block leading-tight">Receive weekly payment and settlement reports by email</span>
            </div>
            <Toggle value={emailEnabled} onChange={setEmailEnabled} />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {preferencesSaved ? (
            <span className="flex items-center gap-1.5 text-[10px] text-[#22C55E] font-bold select-none">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Preferences saved!
            </span>
          ) : <span />}

          <button
            type="button"
            onClick={handleSavePreferences}
            className="bg-[#FF7A00]/10 hover:bg-[#FF7A00]/20 border border-[#FF7A00]/30 hover:border-[#FF7A00]/50 px-5 py-2 rounded-xl text-xs font-black uppercase text-[#FF7A00] transition-all select-none cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 select-none">
          <Shield className="h-4 w-4 text-[#FF7A00]" />
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Account Operations</h3>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between bg-[#070B14]/60 hover:bg-[#070B14] border border-white/[0.06] hover:border-white/[0.12] px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all select-none cursor-pointer"
          >
            Sign Out of Account
            <LogOut className="h-4 w-4 text-[#FF7A00]" />
          </button>

          <button
            type="button"
            onClick={() => { setDeactivateError(''); setShowConfirmModal(true); }}
            className="w-full flex items-center justify-between bg-red-950/10 hover:bg-red-950/20 border border-red-900/15 hover:border-red-900/30 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 transition-all select-none cursor-pointer"
          >
            Soft Deactivate Partner Profile
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
          
          {deactivateError && (
            <p className="text-[10px] text-red-400 font-bold bg-red-500/5 px-3.5 py-2 rounded-xl border border-red-500/10">
              {deactivateError}
            </p>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-semibold select-none">
        <Info className="h-3.5 w-3.5" />
        <span>Volo Partner Application • Version 1.0.0 (Phase 5)</span>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-[#070B14]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="flex items-center gap-2.5 text-red-400 font-black text-sm">
              <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
              Deactivate Partner Profile?
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              This will hide your profile from dispatches, pause active settlement timelines, and sign you out immediately.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={deactivating}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-[#070B14]/60 hover:bg-[#070B14] border border-white/[0.08] py-2.5 px-4 rounded-xl text-xs font-bold uppercase transition-all select-none cursor-pointer text-slate-300"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={deactivating}
                onClick={handleDeactivate}
                className="flex-1 bg-[#EF4444] hover:bg-red-500 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-all select-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
