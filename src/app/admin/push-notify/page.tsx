'use client';
 
import React, { useState, useRef } from 'react';
import { Bell, Users, User, Megaphone, CheckCircle, Loader2, Search, X, Send, Smartphone } from 'lucide-react';
 
type Target = 'specific' | 'all_customers' | 'all_workers' | 'everyone';
 
interface SentLog {
  title: string;
  body: string;
  target: string;
  sentCount: number;
  sentAt: string;
}
 
export default function AdminPushNotifyPage() {
  const [target, setTarget] = useState<Target>('all_customers');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentLogs, setSentLogs] = useState<SentLog[]>([]);
 
  // Specific user search
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const searchTimeout = useRef<any>(null);
 
  const searchUser = (phone: string) => {
    setPhoneSearch(phone);
    setSelectedUser(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (phone.length < 3) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/push-notify?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } finally {
        setSearching(false);
      }
    }, 400);
  };
 
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and message are required.'); return; }
    if (target === 'specific' && !selectedUser) { setError('Please search and select a specific user.'); return; }
 
    setSending(true);
    setError(null);
    setSuccess(null);
 
    try {
      const res = await fetch('/api/admin/push-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          target_user_id: target === 'specific' ? selectedUser?.id : undefined,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json();
 
      if (!res.ok) throw new Error(data.error || 'Send failed');
 
      const targetLabel = target === 'specific' ? selectedUser?.full_name : target.replace(/_/g, ' ');
      setSuccess(`✅ Notification sent to ${data.sent_count} user(s)!`);
      setSentLogs(prev => [{
        title: title.trim(),
        body: body.trim(),
        target: targetLabel,
        sentCount: data.sent_count,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...prev]);
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };
 
  const targetOptions: { value: Target; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'all_customers', label: 'All Customers', icon: <Users className="w-5 h-5" />, description: 'Send to every active customer' },
    { value: 'all_workers', label: 'All Workers', icon: <User className="w-5 h-5" />, description: 'Send to every active worker' },
    { value: 'everyone', label: 'Everyone', icon: <Megaphone className="w-5 h-5" />, description: 'Broadcast to all users' },
    { value: 'specific', label: 'Specific User', icon: <Search className="w-5 h-5" />, description: 'Search by phone number' },
  ];
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none flex items-center gap-2.5">
            <Bell className="w-6.5 h-6.5 text-brand-primary" />
            Notification Broadcasts
          </h1>
          <p className="text-slate-450 text-xs select-none">Send real-time system alerts and push notification updates directly to client apps.</p>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl space-y-6">
          
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Select Target Segment</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {targetOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setTarget(opt.value); setSelectedUser(null); setPhoneSearch(''); setSearchResults([]); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] duration-150 flex flex-col justify-between h-[100px] ${
                    target === opt.value
                      ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary shadow-[0_0_12px_rgba(255,138,0,0.06)]'
                      : 'bg-[#070B14]/40 border-[#1F2937] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={target === opt.value ? 'text-brand-primary' : 'text-slate-500'}>{opt.icon}</span>
                    {target === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-ping" />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider font-mono">{opt.label}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
 
          {/* User Search (specific) */}
          {target === 'specific' && (
            <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Search User credentials</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="+91 98765 43210..."
                  value={phoneSearch}
                  onChange={e => searchUser(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white outline-none transition-colors"
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary animate-spin" />}
              </div>
              
              {searchResults.length > 0 && !selectedUser && (
                <div className="border border-[#1F2937] bg-[#070B14] rounded-xl divide-y divide-[#1F2937]/50 overflow-hidden shadow-2xl">
                  {searchResults.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchResults([]); setPhoneSearch(u.phone); }}
                      className="w-full text-left px-4 py-3 hover:bg-[#111827] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-black text-white">{u.full_name || 'No name registered'}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{u.phone}</p>
                      </div>
                      <span className={`text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full border uppercase font-mono ${
                        u.role === 'customer' ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-amber-900/30 text-amber-400 border-amber-900/50'
                      }`}>{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {selectedUser && (
                <div className="flex items-center justify-between bg-brand-primary/5 border border-brand-primary/25 rounded-xl px-4 py-3 animate-in fade-in duration-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white uppercase font-mono">{selectedUser.full_name} • {selectedUser.phone}</p>
                    <p className="text-[10px] text-slate-500 font-bold">Selected recipient targets</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedUser(null); setPhoneSearch(''); }} 
                    className="p-1 hover:bg-[#172033] rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
 
          {/* Message Form */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Notification Title *</label>
              <input
                type="text"
                placeholder="e.g. 🎉 Special weekend coupon just for you!"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors font-semibold"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Message Body *</label>
                <span className="text-[9px] text-slate-650 font-bold font-mono">{body.length}/300</span>
              </div>
              <textarea
                placeholder="Write your push notification message body details..."
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={300}
                rows={4}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors resize-none font-medium leading-relaxed"
              />
            </div>
          </div>
 
          {/* Status logs */}
          {error && <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-xs font-semibold leading-relaxed">{error}</div>}
          {success && <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-450 rounded-xl text-xs font-semibold leading-relaxed">{success}</div>}
 
          {/* Action Trigger */}
          <button
            onClick={handleSend}
            disabled={loading || !title.trim() || !body.trim() || (target === 'specific' && !selectedUser)}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-brand-primary/10 flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.99] duration-150"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Sending Campaign...' : 'Broadcast Notification'}
          </button>
        </div>
 
        {/* Device Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Phone Mockup Preview */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest font-mono flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" />
              Live Device Mockup Preview
            </h3>
            
            <div className="relative mx-auto w-full max-w-[280px] h-[480px] bg-[#070B14] border-[8px] border-[#1F2937] rounded-[42px] shadow-2xl relative overflow-hidden flex flex-col items-center p-3 select-none">
              {/* Speaker Notch */}
              <div className="absolute top-0 w-32 h-5 bg-[#1F2937] rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-10 h-1 bg-black rounded-full mb-1" />
              </div>
              
              {/* Wallpaper Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#0A0F1E] to-slate-900 z-10" />
              
              {/* Lockscreen Time and Date */}
              <div className="relative z-20 text-center mt-12 space-y-1">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Tuesday, June 16</p>
                <h4 className="text-4xl font-extrabold text-white/95 font-sans tracking-tight">13:30</h4>
              </div>
              
              {/* Notification Overlay Card */}
              <div className="relative z-20 w-full mt-10">
                {(title || body) ? (
                  <div className="w-full bg-slate-900/80 backdrop-blur-md border border-white/[0.06] rounded-2xl p-3.5 space-y-1 shadow-2xl animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img src="/images/logo.jpeg" alt="Logo" className="h-4 w-4 rounded border border-white/10" />
                        <span className="text-[9px] font-black text-slate-350 tracking-wider font-mono">VOLO</span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold font-mono">now</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white tracking-tight leading-snug truncate">{title || 'Coupon Campaign Title'}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3">{body || 'Campaign message description payload goes here...'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    Enter message above to preview
                  </div>
                )}
              </div>
            </div>
          </div>
 
          {/* Sent Log list */}
          {sentLogs.length > 0 && (
            <div className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="px-5 py-4 border-b border-[#1F2937] bg-[#070B14]/40">
                <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest font-mono">Transmitted This Session</h3>
              </div>
              <div className="divide-y divide-[#1F2937]/50 max-h-[220px] overflow-y-auto">
                {sentLogs.map((log, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-[#172033]/25 transition-colors">
                    <div className="space-y-0.5 pr-2 truncate flex-1">
                      <p className="text-xs font-bold text-white truncate">{log.title}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate">→ {log.target} • {log.sentAt}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-lg text-emerald-450 font-bold text-[9px] font-mono">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-450" />
                      <span>{log.sentCount} sent</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
