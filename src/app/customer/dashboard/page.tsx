'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { 
  Sparkles, Calendar, Briefcase, History, CreditCard, 
  Star, ArrowRight, Loader2, AlertCircle, CheckCircle, Clock, 
  ChevronRight, Zap, Wrench, Snowflake, Hammer, Bug, Droplets,
  Paintbrush, Phone, MessageSquare, Plus, ChevronLeft, 
  ShieldCheck, Send, Share2, Flame, ShieldAlert, X, MapPin, Check, HelpCircle
} from 'lucide-react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to load dashboard data');
  }
  return res.json();
};

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('elect')) return Zap;
  if (n.includes('plumb')) return Wrench;
  if (n.includes('ac') || n.includes('cool') || n.includes('appliance')) return Snowflake;
  if (n.includes('carpenter') || n.includes('wood')) return Hammer;
  if (n.includes('clean') || n.includes('sanit')) return Sparkles;
  if (n.includes('paint')) return Paintbrush;
  if (n.includes('pest')) return Bug;
  if (n.includes('water') || n.includes('purif')) return Droplets;
  return Sparkles;
};

const getCategoryDesc = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('elect')) return 'Fan, lights, fuses';
  if (n.includes('plumb')) return 'Leaks, taps, pipe fixes';
  if (n.includes('ac')) return 'Deep clean & gas fill';
  if (n.includes('carpenter')) return 'Door locks & furniture';
  if (n.includes('clean')) return 'Kitchen & sofa wash';
  if (n.includes('paint')) return 'Wall touch-ups & consulting';
  return 'Expert care & installations';
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  
  // Dashboard SWR Data Fetching
  const { data, error, isLoading } = useSWR('/api/customer/dashboard', fetcher, {
    refreshInterval: 30000 // Poll every 30 seconds
  });

  // Wallet SWR Data Fetching
  const { data: walletData } = useSWR('/api/customer/wallet', fetcher);
  const walletBalance = walletData ? Number(walletData.balance) : 0;

  // Invoices SWR Data Fetching
  const { data: invoicesData } = useSWR('/api/customer/invoices', fetcher);
  const invoicesList = invoicesData?.invoices || [];

  // Services Catalog Fetching
  const { data: servicesData } = useSWR('/api/customer/services', fetcher);
  const categoriesList = servicesData?.categories || [];

  // UI Interactive States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [comingSoonCategory, setComingSoonCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'recent'>('all');
  
  // Modals & Popups States
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hi! Need help with your booking? I am your Volo Assistant.' }
  ]);
  
  // Reschedule & Cancel Target Bookings
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any | null>(null);
  const [bookingToReschedule, setBookingToReschedule] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [ratingBooking, setRatingBooking] = useState<any | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [showInvoicesCenter, setShowInvoicesCenter] = useState(false);

  // Live map animation coordinate state
  const [mapCarProgress, setMapCarProgress] = useState(0);
  const [greeting, setGreeting] = useState('Hello');

  // Trigger smooth car movement animation for active journey map
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good Morning ☀️');
    else if (hrs < 17) setGreeting('Good Afternoon 🌤️');
    else setGreeting('Good Evening 🌙');

    const interval = setInterval(() => {
      setMapCarProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // API Call handlers
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/customer/bookings/${bookingToCancel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel booking');
      }
      triggerToast('Booking cancelled successfully.');
      setBookingToCancel(null);
      mutate('/api/customer/dashboard');
    } catch (err: any) {
      alert(err.message || 'Error cancelling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!bookingToReschedule || !rescheduleDate) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/customer/bookings/${bookingToReschedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: new Date(rescheduleDate).toISOString() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reschedule booking');
      }
      triggerToast('Booking rescheduled successfully.');
      setBookingToReschedule(null);
      mutate('/api/customer/dashboard');
    } catch (err: any) {
      alert(err.message || 'Error rescheduling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingBooking) return;
    try {
      setActionLoading(true);
      triggerToast(`Thank you for rating ${ratingBooking.service_items?.name}!`);
      setRatingBooking(null);
      setRatingComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');

    // Simulated Bot Responses
    setTimeout(() => {
      let reply = 'I will get our support team to look into your booking right away.';
      if (msg.toLowerCase().includes('cancel')) {
        reply = 'You can cancel any upcoming bookings directly from your Dashboard list by clicking the "Cancel Booking" button.';
      } else if (msg.toLowerCase().includes('track') || msg.toLowerCase().includes('location')) {
        reply = 'If your technician is dispatched, you will see a live GPS map on your Dashboard. You can also click "Track Live" to see the full path.';
      } else if (msg.toLowerCase().includes('plumber') || msg.toLowerCase().includes('electrician')) {
        reply = 'We support quick dispatch of Plumbers and Electricians. Select their category at the top of your dashboard to book.';
      } else if (msg.toLowerCase().includes('emergency')) {
        reply = 'If you have a critical leakage or electrical hazard, click the red "EMERGENCY BOOK" button at the bottom of the dashboard.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };


  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-450 mt-3 font-bold tracking-wider uppercase animate-pulse">Fetching premium dashboard metrics...</p>
      </div>
    );
  }

  if (error || !data || data.error) {
    return (
      <div className="bg-[#0F172A] border border-white/[0.08] p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-2xl">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="font-display font-black text-white">Failed to load Dashboard</h3>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {error?.message || data?.error || 'There was a problem retrieving your dashboard data. Please try refreshing.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { profileCompletion, activeBookings, recentBookings, upcomingBookingsList, user } = data;

  const referralCode = user?.full_name ? `VOLO_${user.full_name.replace(/\s+/g, '').substring(0, 4).toUpperCase()}99` : 'VOLO_REFER_99';
  const lastWorkerBooking = recentBookings?.find((b: any) => b.status === 'COMPLETED' && b.workers?.users?.full_name);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-orange-500/10 text-[#FF7A00] border border-[#FF7A00]/25 font-mono">Pending</span>;
      case 'WORKER_ASSIGNED':
      case 'WORKER_ACCEPTED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-blue-500/10 text-[#38BDF8] border border-blue-500/25 font-mono">Assigned</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono animate-pulse">En Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono">Arrived</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/25 font-mono">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-white/5 text-slate-400 border border-white/[0.08] font-mono">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 font-mono line-through">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-lg bg-white/5 text-slate-300 font-mono">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none relative">
      
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#0F172A] border border-white/[0.08] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in-up">
          <CheckCircle className="h-4 w-4 text-[#5CBF2A]" />
          {toastMessage}
        </div>
      )}

      {/* Grid Layout: Main section and side columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Core Interactions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ================= 1. DASHBOARD HERO ================= */}
          <div className="bg-gradient-to-br from-[#FF7A00] to-orange-700 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-orange-500/10 border border-white/[0.06]">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#5CBF2A]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3.5">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none">
                  {greeting}, {user?.full_name?.split(' ')[0] || 'Customer'} 👋
                </h1>
                <p className="text-xs text-orange-50/90 max-w-sm font-semibold leading-relaxed">
                  Need household support today? Book vetted experts instantly with live journey tracking.
                </p>

              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 select-none font-display">
                <button
                  type="button"
                  onClick={() => router.push('/customer/services')}
                  className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 border border-white/10 px-4 py-3.5 rounded-2xl transition-all cursor-pointer hover-scale text-center"
                >
                  <Plus className="h-5 w-5 mb-1.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono">Book Service</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeBookings && activeBookings.length > 0) {
                      router.push(`/customer/bookings/${activeBookings[0].id}`);
                    } else {
                      triggerToast("No active bookings currently en route.");
                    }
                  }}
                  className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 border border-white/10 px-4 py-3.5 rounded-2xl transition-all cursor-pointer hover-scale text-center"
                >
                  <MapPin className="h-5 w-5 mb-1.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono">Track Tech</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/customer/bookings')}
                  className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 border border-white/10 px-4 py-3.5 rounded-2xl transition-all cursor-pointer hover-scale text-center"
                >
                  <History className="h-5 w-5 mb-1.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono">History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoicesCenter(true)}
                  className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 border border-white/10 px-4 py-3.5 rounded-2xl transition-all cursor-pointer hover-scale text-center"
                >
                  <CreditCard className="h-5 w-5 mb-1.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono">Payments</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= 2. SERVICE CATEGORIES ================= */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Service Categories</span>
              <button 
                type="button" 
                onClick={() => router.push('/customer/services')}
                className="text-[10px] font-black text-[#FF7A00] uppercase tracking-wider flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                All Services <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Horizontal Category Cards Scroller */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth select-none">
              {categoriesList.map((cat: any) => {
                const Icon = getCategoryIcon(cat.name);
                const desc = getCategoryDesc(cat.name);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      router.push(`/customer/services?categoryId=${cat.id}`);
                    }}
                    className="flex-shrink-0 w-28 bg-[#0F172A] border border-white/[0.08] hover:border-[#FF7A00]/40 rounded-2xl p-4 flex flex-col justify-between items-start gap-4 cursor-pointer hover-scale transition-all group shadow-md shadow-[#070B14]/40"
                  >
                    <div className="p-2.5 rounded-xl border bg-orange-500/10 border-[#FF7A00]/20 text-[#FF7A00] group-hover:bg-[#FF7A00] group-hover:text-white group-hover:border-transparent transition-colors duration-250">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-white leading-snug group-hover:text-[#FF7A00] transition-colors">{cat.name}</h4>
                      <p className="text-[8px] text-slate-400 mt-0.5 truncate w-20 font-bold font-mono">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= 3. ACTIVE BOOKING & LIVE JOURNEY CARD ================= */}
          {activeBookings && activeBookings.length > 0 ? (
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1 font-mono">Active Tracking</span>
              
              {activeBookings.map((b: any) => {
                const progressWidth = b.status === 'ON_THE_WAY' ? '33%' : b.status === 'ARRIVED' ? '66%' : '100%';
                const etaDesc = b.status === 'ON_THE_WAY' ? 'Arriving in 12 mins' : b.status === 'ARRIVED' ? 'Arrived at your gate' : 'Work started';

                return (
                  <div key={b.id} className="bg-[#0F172A] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl shadow-[#070B14]/40 space-y-4 p-5 hover-scale transition-all duration-300">
                    
                    {/* Header info */}
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3.5">
                      <div>
                        <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-500/10 text-[#38BDF8] border border-blue-500/25 font-mono">Live dispatch</span>
                        <h3 className="font-display font-black text-sm text-white mt-1">{b.service_items?.name || 'Home Service'}</h3>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    {/* Uber-like interactive SVG map */}
                    <div className="h-40 bg-[#070B14] border border-white/[0.08] rounded-2xl relative overflow-hidden">
                      {/* Grid representation */}
                      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="none" />
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Streets */}
                        <path d="M0,60 L240,60 L240,160" fill="none" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <path d="M120,0 L120,60 L380,60" fill="none" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <path d="M240,60 L320,60 L320,160" fill="none" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />

                        {/* Path travel marker */}
                        <path d="M60,60 L240,60 L240,120" fill="none" stroke="#0EA5E9" strokeWidth="3" strokeDasharray="5 3" />

                        {/* Customer home anchor */}
                        <circle cx="240" cy="120" r="10" fill="#5CBF2A" opacity="0.3" className="animate-ping" />
                        <circle cx="240" cy="120" r="5" fill="#5CBF2A" />

                        {/* Car indicator anim */}
                        <g transform={`translate(${60 + (180 * (mapCarProgress / 100))}, 60)`}>
                          <circle cx="0" cy="0" r="8" fill="#FF7A00" opacity="0.4" className="animate-pulse" />
                          <circle cx="0" cy="0" r="5" fill="#FF7A00" />
                        </g>
                      </svg>

                      {/* Map overlay tags */}
                      <div className="absolute top-3 right-3 bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[9px] font-bold text-slate-200 border border-white/[0.08] shadow-sm font-mono">
                        ETA: 12 mins • 1.4 km
                      </div>
                      <div className="absolute bottom-3 left-3 bg-[#0F172A] text-white px-2.5 py-1 rounded-xl text-[9px] font-bold border border-white/[0.08] shadow-sm flex items-center gap-1.5 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                        Technician en route
                      </div>
                    </div>

                    {/* Progress track timeline */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-300">
                        <span>{etaDesc}</span>
                        <span className="font-mono">{progressWidth} complete</span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#FF7A00] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,122,0,0.5)]" style={{ width: progressWidth }} />
                      </div>
                    </div>

                    {/* Technician details */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-[#FF7A00]/25 flex items-center justify-center font-black text-xs uppercase text-[#FF7A00]">
                          {b.workers?.users?.full_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white leading-none">{b.workers?.users?.full_name || 'Assigned Professional'}</p>
                          <span className="text-[8px] font-bold uppercase text-[#5CBF2A] tracking-wider mt-1 block font-mono">Volo Vetted Partner</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerToast(`Dialing +91 98765 43210 for ${b.workers?.users?.full_name || 'technician'}...`)}
                          className="p-2.5 bg-[#070B14] hover:bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSupportWidgetOpen(true);
                            setChatMessages(prev => [...prev, { sender: 'bot', text: `Hi, connecting you with ${b.workers?.users?.full_name || 'your technician'}. Feel free to write details here.` }]);
                          }}
                          className="p-2.5 bg-[#070B14] hover:bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Chat"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/customer/bookings/${b.id}`)}
                          className="px-3 py-2 bg-[#0EA5E9] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
                        >
                          Track Live
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : null}

          {/* ================= 4. DASHBOARD TAB FILTER ================= */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2 px-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Bookings & Services</span>
              
              <div className="flex gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-orange-500/10 text-[#FF7A00] font-mono' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'active' ? 'bg-orange-500/10 text-[#FF7A00] font-mono' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'upcoming' ? 'bg-orange-500/10 text-[#FF7A00] font-mono' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('recent')}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'recent' ? 'bg-orange-500/10 text-[#FF7A00] font-mono' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Recent
                </button>
              </div>
            </div>

            {/* List block */}
            <div className="space-y-4">
              
              {/* Upcoming Bookings cards */}
              {(activeTab === 'all' || activeTab === 'upcoming') && upcomingBookingsList && upcomingBookingsList.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-505 tracking-wider px-1 block font-mono">Scheduled Upcoming</span>
                  {upcomingBookingsList.map((b: any) => (
                    <div key={b.id} className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.15] hover:shadow-xl hover:shadow-[#070B14]/40 transition-all flex flex-col justify-between gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <h4 className="font-display font-bold text-sm text-white leading-snug">{b.service_items?.name || 'Scheduled Service'}</h4>
                          <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-slate-400 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              {new Date(b.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              {new Date(b.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              {b.address_line}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(b.status)}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-white/[0.06] select-none">
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(b)}
                          className="px-3.5 py-2 bg-[#070B14] hover:bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingToReschedule(b);
                            setRescheduleDate(b.scheduled_at ? b.scheduled_at.substring(0,16) : '');
                          }}
                          className="px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-[#FF7A00]/25 text-[#FF7A00] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Services completed jobs */}
              {(activeTab === 'all' || activeTab === 'recent') && recentBookings && recentBookings.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-505 tracking-wider px-1 block font-mono">Recent Completed / Cancelled</span>
                  <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl shadow-[#070B14]/40 divide-y divide-white/[0.06]">
                    {recentBookings.filter((b: any) => b.status === 'COMPLETED' || b.status === 'CANCELLED').map((b: any) => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="font-display font-bold text-xs text-white truncate leading-none">{b.service_items?.name || 'Home Maintenance'}</h4>
                          <span className="text-[9px] text-slate-450 block font-bold leading-none font-mono">
                            {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {b.address_line}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(b.status)}

                          {b.status === 'COMPLETED' && (
                            <div className="flex items-center gap-2 select-none">
                              <button
                                type="button"
                                onClick={() => setRatingBooking(b)}
                                className="p-2.5 bg-[#070B14] hover:bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Rate Service"
                              >
                                <Star className="h-3.5 w-3.5 text-amber-450 fill-amber-405" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerToast(`Rebooking ${b.service_items?.name}...`)}
                                className="px-3.5 py-2 bg-[#FF7A00] hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                              >
                                Rebook
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No items fallback */}
              {activeTab === 'active' && activeBookings.length === 0 && (
                <p className="text-[10px] text-slate-500 italic font-semibold text-center py-8 font-mono">No active bookings scheduled currently.</p>
              )}
            </div>
          </div>

          {/* ================= 5. AI SMART RECOMMENDATIONS ================= */}
          {categoriesList && categoriesList.length > 0 && (
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-5 relative overflow-hidden shadow-xl border border-white/[0.08]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full" />
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="h-10 w-10 rounded-2xl bg-orange-500/20 text-[#FF7A00] flex items-center justify-center shrink-0 border border-[#FF7A00]/30">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-2.5">
                  <span className="text-[8px] font-black uppercase text-[#FF7A00] tracking-widest leading-none block font-mono">AI Recommendation Engine</span>
                  <h4 className="font-display font-black text-sm leading-snug">{categoriesList[0]?.name || 'Home Maintenance'} Recommended</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Based on your home profile, we recommend checking out our top-rated {categoriesList[0]?.name?.toLowerCase() || 'maintenance'} professionals to keep everything running smoothly.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/customer/services?categoryId=${categoriesList[0]?.id}`)}
                    className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-orange-500/15"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* ================= 8. EMERGENCY SERVICE DISPATCH ================= */}
          <div className="bg-red-500/[0.03] border border-red-500/20 rounded-3xl p-6 shadow-xl space-y-4 shadow-red-500/2">
            <div className="flex items-center gap-2.5 text-red-500">
              <Flame className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
              <h3 className="font-display font-black text-sm tracking-tight leading-none">Volo Emergency Help</h3>
            </div>
            
            <p className="text-[10px] text-red-300 font-medium leading-relaxed">
              Critical pipeline burst or major power failure? Confirm emergency dispatch of the nearest technician in 15 mins.
            </p>

            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="w-full py-3.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/15 cursor-pointer animate-pulse-slow active:scale-98"
            >
              Emergency Book (15 Min Dispatch)
            </button>
          </div>

          {/* ================= 9. PROFILE COMPLETION CHECKLIST ================= */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Profile Completeness</span>
              <span className="text-xs font-black text-white font-mono">{profileCompletion}%</span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 text-xs font-semibold text-slate-300 select-none">
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#5CBF2A] stroke-[3]" />
                <span className="line-through text-slate-505">Phone Verified</span>
              </div>
              <div className="flex items-center gap-2.5">
                {profileCompletion >= 50 ? (
                  <Check className="h-4 w-4 text-[#5CBF2A] stroke-[3]" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/[0.15] flex items-center justify-center shrink-0" />
                )}
                <span className={profileCompletion >= 50 ? 'line-through text-slate-500' : 'text-slate-350'}>Default Address Added</span>
              </div>
              <div className="flex items-center gap-2.5">
                {data?.user?.email ? (
                  <Check className="h-4 w-4 text-[#5CBF2A] stroke-[3]" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/[0.15] flex items-center justify-center shrink-0" />
                )}
                <span className={data?.user?.email ? 'line-through text-slate-505' : 'text-slate-350'}>Email Address Linked</span>
              </div>
              <div className="flex items-center gap-2.5">
                {data?.user?.avatar_url ? (
                  <Check className="h-4 w-4 text-[#5CBF2A] stroke-[3]" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/[0.15] flex items-center justify-center shrink-0" />
                )}
                <span className={data?.user?.avatar_url ? 'line-through text-slate-505' : 'text-slate-350'}>Profile Avatar Uploaded</span>
              </div>
            </div>

            {/* Checklist progress bar */}
            <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF7A00] to-[#5CBF2A] h-full rounded-full transition-all duration-1000" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>

          {/* ================= 11. REFERRAL SHARE CARD ================= */}
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Share2 className="h-4.5 w-4.5 text-[#FF7A00]" />
              <h4 className="font-display font-bold text-xs">Share Referral Program</h4>
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Earn 500 reward points on your next booking when your friends sign up and complete their first task.
            </p>

            <div className="flex items-center bg-[#070B14] border border-white/[0.08] rounded-xl p-2.5 justify-between">
              <span className="text-[10px] font-black text-white font-mono tracking-wider">{referralCode}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  triggerToast('Referral code copied to clipboard!');
                }}
                className="text-[9px] font-black text-[#FF7A00] uppercase tracking-wider hover:underline cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>

          {/* ================= 12. PREVIOUS TECHNICIAN REBOOK ================= */}
          {lastWorkerBooking && (
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Rebook Technician</span>
              
              <div className="flex items-center justify-between gap-3 p-2.5 hover:bg-white/[0.02] rounded-2xl transition-colors border border-transparent hover:border-white/[0.06] cursor-pointer" onClick={() => triggerToast(`Assigning ${lastWorkerBooking.workers.users.full_name} to your task booking...`)}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center font-black text-xs text-rose-500 font-mono">
                    {lastWorkerBooking.workers.users.full_name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white leading-none">{lastWorkerBooking.workers.users.full_name}</h5>
                    <span className="text-[8px] font-bold text-slate-400 mt-1 block font-mono">{lastWorkerBooking.service_items?.name || 'Home Maintenance'} • ⭐ 4.9</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ================= INVOICE CENTER MODAL ================= */}
      {showInvoicesCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h3 className="text-md font-display font-black text-white">Digital Invoice Center</h3>
              <button onClick={() => setShowInvoicesCenter(false)} className="p-1.5 hover:bg-white/[0.05] rounded-xl transition-colors"><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            
            <div className="divide-y divide-white/[0.06] max-h-64 overflow-y-auto pr-1">
              {invoicesList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8 font-mono">No invoices available yet.</p>
              ) : (
                invoicesList.map((inv: any) => (
                  <div key={inv.id} className="py-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{inv.service_items?.name || 'Service'} (#{inv.id.substring(0, 8).toUpperCase()})</p>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">
                        Date: {new Date(inv.created_at).toLocaleDateString()} • Amount: ₹{Number(inv.total_amount || inv.amount || 0).toFixed(0)}
                      </span>
                    </div>
                    <button
                      onClick={() => triggerToast(`Downloading invoice for ${inv.service_items?.name || 'service'}...`)}
                      className="px-3 py-1.5 bg-[#070B14] border border-white/[0.08] text-white text-[9px] font-black uppercase rounded-lg hover:bg-white/[0.03] cursor-pointer font-mono"
                    >
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= COMING SOON MODAL ================= */}
      {comingSoonCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4 text-center animate-fade-in-up">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-[#FF7A00]/20 flex items-center justify-center mx-auto text-[#FF7A00]">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-white text-base">{comingSoonCategory} is arriving soon!</h3>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold max-w-xs mx-auto">
              Our team is vetting and certifying top professional partners in your city. Be the first to know when we launch!
            </p>
            <div className="flex gap-2.5 pt-2 select-none">
              <button
                type="button"
                onClick={() => setComingSoonCategory(null)}
                className="flex-1 py-2.5 border border-white/[0.08] text-slate-300 text-xs font-bold uppercase rounded-xl hover:bg-white/[0.03] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerToast(`We will notify you when ${comingSoonCategory} is live!`);
                  setComingSoonCategory(null);
                }}
                className="flex-1 py-2.5 bg-[#FF7A00] hover:bg-orange-600 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CANCEL CONFIRM MODAL ================= */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-450">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-white text-base">Cancel Booking?</h3>
            <p className="text-xs text-slate-405 leading-relaxed font-semibold">
              Are you sure you want to cancel your upcoming service booking? This action is reversible.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-white/[0.08] text-slate-350 text-xs font-bold uppercase rounded-xl hover:bg-white/[0.03] cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer flex justify-center items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESCHEDULE MODAL ================= */}
      {bookingToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-black text-white text-base">Reschedule Booking</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Select New Date & Time</label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-[#070B14] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF7A00]"
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToReschedule(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-white/[0.08] text-slate-350 text-xs font-bold uppercase rounded-xl hover:bg-white/[0.03] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleBooking}
                disabled={actionLoading || !rescheduleDate}
                className="flex-1 py-2.5 bg-[#FF7A00] hover:bg-orange-600 text-white text-xs font-black uppercase rounded-xl cursor-pointer flex justify-center items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RATING SERVICE MODAL ================= */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm select-none">
          <form onSubmit={handleSubmitRating} className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-black text-white text-base">Rate Completed Service</h3>
            
            {/* Rating Stars Selection */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="focus:outline-none cursor-pointer"
                >
                  <Star className={`h-8 w-8 ${star <= ratingStars ? 'text-amber-555 fill-amber-500' : 'text-white/10'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono font-bold">Share feedback</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Describe your service partner's professionalism and skill..."
                rows={3}
                className="w-full bg-[#070B14] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-[#FF7A00] resize-none leading-relaxed"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRatingBooking(null)}
                className="flex-1 py-2.5 border border-white/[0.08] text-slate-350 text-xs font-bold uppercase rounded-xl hover:bg-white/[0.03] cursor-pointer"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-[#FF7A00] hover:bg-orange-600 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= EMERGENCY MODAL ================= */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-550">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-white text-base">Confirm Emergency Dispatch?</h3>
            <p className="text-xs text-red-200 font-medium leading-relaxed max-w-xs mx-auto">
              Our support team will call you back within 1 min to coordinate arrival. Dispatching closest available plumber/electrician immediately.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="flex-1 py-2.5 border border-white/[0.08] text-slate-350 text-xs font-bold uppercase rounded-xl hover:bg-white/[0.03] cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerToast('Emergency dispatch confirmed! Volo support is calling...');
                  setEmergencyModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= FLOATING CHAT WIDGET ================= */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
        
        {/* Chat Window Panel */}
        {supportWidgetOpen && (
          <div className="w-80 bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up font-sans">
            
            {/* Window header */}
            <div className="bg-[#FF7A00] p-4 text-white flex justify-between items-center border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                <h4 className="text-xs font-black uppercase tracking-wider font-mono">Volo Assistant</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setSupportWidgetOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body messages area */}
            <div className="h-60 overflow-y-auto p-4 space-y-3.5 bg-[#070B14]/40">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[11px] font-semibold leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#FF7A00] text-white'
                      : 'bg-[#070B14] border border-white/[0.08] text-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input form */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/[0.06] flex gap-2 bg-[#0F172A]">
              <input
                type="text"
                placeholder="Ask support chatbot..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#070B14] border border-white/[0.08] focus:bg-[#070B14] focus:border-[#FF7A00] text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all placeholder-slate-500"
              />
              <button
                type="submit"
                className="p-2 bg-[#FF7A00] hover:bg-orange-600 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        )}

        {/* Float action trigger button */}
        <button
          type="button"
          onClick={() => setSupportWidgetOpen(!supportWidgetOpen)}
          className="h-12 w-12 rounded-full bg-[#FF7A00] hover:bg-orange-600 border border-white/[0.08] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover-scale"
          title="Customer Support Assistant"
        >
          {supportWidgetOpen ? <X className="h-5 w-5 animate-rotate-glow" /> : <HelpCircle className="h-5 w-5 animate-pulse-slow" />}
        </button>
      </div>

    </div>
  );
}
