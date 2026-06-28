'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, ShieldAlert, Loader2, 
  CheckCircle2, AlertCircle, Save, MessageSquare, Mail, Zap 
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

export default function CustomerSettingsPage() {
  const router = useRouter();
  
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Notification preferences updated successfully.');
    }, 800);
  };

  const handleDeactivateAccount = async () => {
    const doubleCheck = confirm(
      'Are you absolutely sure you want to deactivate your Volo customer account?\n\nThis will soft-delete your profile, cancel active requests, and log you out immediately.'
    );
    if (!doubleCheck) return;
    setDeactivating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/customer/profile', { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to deactivate account.');
      await fetch('/api/auth/logout', { method: 'POST' });
      alert('Your customer account has been deactivated. Redirecting...');
      router.push('/customer/login');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during account deactivation.');
      setDeactivating(false);
    }
  };

  const preferences = [
    { icon: MessageSquare, label: 'SMS Notifications', desc: 'Receive OTP codes and en route alerts via SMS text.', value: smsNotif, onChange: setSmsNotif },
    { icon: Mail, label: 'Email Invoices', desc: 'Receive billing receipts directly in your email inbox.', value: emailNotif, onChange: setEmailNotif },
    { icon: Zap, label: 'Real-time Push Alerts', desc: 'Enable browser notifications for worker live tracking changes.', value: pushNotif, onChange: setPushNotif },
  ];

  return (
    <div className="space-y-6 max-w-xl mx-auto selection:bg-orange-500/30 selection:text-white">

      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#FF7A00]" />
          Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Configure system preferences, alert channels, and privacy details.</p>
      </div>

      {/* Preferences form */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 select-none">
          <Bell className="h-4 w-4 text-[#FF7A00]" />
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Notification Channels</h3>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          {preferences.map(({ icon: Icon, label, desc, value, onChange }, i) => (
            <div key={label} className={`flex items-center justify-between gap-4 select-none ${i > 0 ? 'border-t border-white/[0.04] pt-5' : ''}`}>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[#FF7A00]" />
                  {label}
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
              </div>
              <Toggle value={value} onChange={onChange} />
            </div>
          ))}

          {successMsg && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-2xl flex items-center gap-2 text-[#22C55E] text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF9E43] text-white py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 select-none cursor-pointer disabled:opacity-40 active:scale-95"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Save className="h-4 w-4" />Save Preferences</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#0F172A] border border-red-500/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-red-500/10 pb-3 select-none">
          <ShieldAlert className="h-4 w-4 text-[#EF4444]" />
          <h3 className="text-[10px] uppercase font-black text-red-400 tracking-widest">Danger Zone</h3>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
            Deactivating your account will set your profile status to inactive and sign you out. You will need to contact the administrator to reactivate.
          </p>

          {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-2xl flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleDeactivateAccount}
            disabled={deactivating}
            className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-red-500/20 hover:border-red-500/40 text-[#EF4444] py-3 px-6 rounded-2xl text-xs font-black uppercase transition-all select-none cursor-pointer disabled:opacity-40"
          >
            {deactivating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deactivating Account...
              </span>
            ) : 'Deactivate My Account'}
          </button>
        </div>
      </div>

    </div>
  );
}
