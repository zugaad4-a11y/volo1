'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Briefcase, User, Calendar, ShieldCheck, DollarSign, History, 
  Settings, LayoutDashboard, CreditCard, LogOut, Menu, X, Bell, 
  Wallet, MapPin, Search, ChevronDown, Zap, Shield, Users, IdCard
} from 'lucide-react';
import Link from 'next/link';
import DigitalIdCardModal from '@/components/worker/DigitalIdCardModal';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read?: boolean;
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // States
  const [loading, setLoading] = useState(true);
  const [kycApproved, setKycApproved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [workerStatus, setWorkerStatus] = useState<string>('OFFLINE');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ID Card states
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [workerDetails, setWorkerDetails] = useState<any>(null);
  
  // UI States
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Refs for closing popovers on click outside
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Authentication & KYC check
  useEffect(() => {
    async function checkAuthAndKyc() {
      try {
        // 1. Verify Authentication & Role
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/worker/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.user?.role !== 'worker') {
          const fallback = meData.user?.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
          router.push(fallback);
          return;
        }
        setUser(meData.user);

        // 2. Verify KYC Status
        const kycRes = await fetch('/api/worker/kyc');
        if (!kycRes.ok) {
          throw new Error('Failed to fetch KYC');
        }
        const kycData = await kycRes.json();
        const isApproved = kycData.kycState?.overall_status === 'APPROVED';
        setKycApproved(isApproved);
        setKycDocs(kycData.documents || []);

        const details = {
          id: meData.user.id,
          full_name: meData.user.full_name,
          phone: meData.user.phone,
          dob: kycData.bankDetails?.dob,
          worker_id_code: kycData.bankDetails?.worker_id_code,
          skills: []
        };
        setWorkerDetails(details);

        if (isApproved) {
          const profileRes = await fetch('/api/worker/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            details.skills = profileData.skills || [];
            setWorkerDetails({ ...details });
          }
        }

        // 3. Enforce KYC Redirect
        if (!isApproved) {
          if (pathname !== '/worker/kyc' && pathname !== '/worker/settings') {
            router.push('/worker/kyc');
            return;
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error verifying worker layout state:', err);
        router.push('/worker/login');
      }
    }

    checkAuthAndKyc();
  }, [pathname, router]);

  // Sync state & poll dashboard data (updates worker status, wallet balance, and notifications)
  useEffect(() => {
    if (!user || !kycApproved) return;

    let active = true;
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/worker/dashboard');
        if (!res.ok) return;
        const data = await res.json();
        if (active && data) {
          setWorkerStatus(data.currentStatus || 'OFFLINE');
          setWalletBalance(data.commissionWalletBalance || 0);
          setNotifications(data.recentNotifications || []);
        }
      } catch (err) {
        console.warn('Transient network drop or server rebuild during dashboard poll:', err);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, kycApproved]);

  // High-accuracy background GPS position watcher
  useEffect(() => {
    if (!user || !kycApproved) return;
    if (workerStatus === 'OFFLINE' || workerStatus === 'VACATION') return;

    let watchId: number | null = null;
    let lastUpdateEpoch = 0;

    const sendCoords = async (pos: GeolocationPosition) => {
      const now = Date.now();
      // Throttle GPS updates to once every 20 seconds
      if (now - lastUpdateEpoch < 20000) return;
      lastUpdateEpoch = now;

      try {
        await fetch('/api/worker/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
            deviceType: 'WEB',
          }),
        });
      } catch (err) {
        console.error('Failed to report live GPS coordinates:', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendCoords(pos),
        (err) => console.warn('[GPS] Initial position watch failed:', { code: err.code, message: err.message }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => sendCoords(pos),
        (err) => console.error('[GPS] Location watch error:', { code: err.code, message: err.message }),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user, kycApproved, workerStatus]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/worker/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/worker/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/worker/jobs');
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/worker/alerts', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    } finally {
      setNotificationsOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-white">
        <span className="h-10 w-10 border-4 border-amber-500/20 border-t-[#FF7A00] rounded-full animate-spin shadow-lg shadow-orange-500/10" />
        <p className="text-xs text-slate-400 mt-4 font-semibold tracking-wider uppercase animate-pulse">Initializing VOLO Engine...</p>
      </div>
    );
  }

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased flex flex-col selection:bg-orange-500/30 selection:text-white">
      
      {/* Premium Desktop Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-[#070B14]/40 transition-all select-none">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo */}
          <Link href="/worker/dashboard" className="flex items-center gap-3 group shrink-0 transition-transform active:scale-95">
            <img 
              src="/images/logo.jpeg" 
              alt="VOLO Logo" 
              className="h-10 w-10 rounded-xl object-contain border border-white/[0.08] shadow-md group-hover:scale-105 transition-transform duration-300" 
            />
            <div className="flex flex-col">
              <span className="font-display font-black text-base leading-none tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
                VOLO WORKER
              </span>
              <span className="text-[9px] font-bold text-[#FF7A00] tracking-widest uppercase mt-0.5 font-mono">
                Field Partner
              </span>
            </div>
          </Link>

          {/* Center: Search Jobs */}
          <div className="hidden md:block flex-1 max-w-md mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#FF7A00] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search jobs by client name, ID, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070B14]/60 border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition-all focus:bg-[#070B14] focus:ring-4 focus:ring-orange-500/5 shadow-inner"
              />
            </form>
          </div>

          {/* Right: Notifications, Wallet, Profile Actions */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Wallet Quick Widget */}
            <Link 
              href="/worker/settlements" 
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0F172A] border border-white/[0.08] hover:border-[#FF7A00]/40 rounded-2xl shadow-md transition-all hover:-translate-y-0.5 duration-200 active:scale-95 group"
            >
              <div className="h-7 w-7 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-[#FF7A00]/20 transition-colors">
                <Wallet className="h-4 w-4 text-[#FF7A00]" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Earnings</span>
                <span className="text-xs font-extrabold text-white group-hover:text-[#FF7A00] transition-colors">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </Link>

            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all relative border ${
                  notificationsOpen 
                    ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30 text-[#FF7A00]' 
                    : 'bg-[#0F172A] border-white/[0.08] text-slate-350 hover:text-white hover:border-white/[0.15]'
                } shadow-md active:scale-95 cursor-pointer`}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#EF4444] text-[8px] font-black text-white flex items-center justify-center animate-bounce shadow-sm shadow-red-500/30">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Live Feeds</h4>
                    <span className="text-[9px] font-bold text-slate-500 font-mono">{notifications.length} alerts</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04] no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className="p-4 hover:bg-[#070B14]/40 transition-colors flex gap-3">
                          <div className="h-2 w-2 rounded-full bg-[#FF7A00] shrink-0 mt-1.5" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-200 leading-tight">{n.title}</p>
                            <p className="text-[10px] text-slate-450 leading-relaxed font-medium">{n.body}</p>
                            <span className="text-[8px] text-slate-600 font-bold block mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs font-bold flex flex-col items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-slate-700" />
                        No alerts in feed
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#070B14]/40 border-t border-white/[0.06] text-center">
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      className="text-[10px] text-[#FF7A00] hover:text-[#FF9E43] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear / Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Capsule */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-2xl border transition-all ${
                  profileDropdownOpen 
                    ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30 text-white' 
                    : 'bg-[#0F172A] border-white/[0.08] text-slate-350 hover:text-white hover:border-white/[0.15]'
                } shadow-md active:scale-95 cursor-pointer`}
              >
                <div className="h-7 w-7 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.full_name?.charAt(0) || 'W'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-white truncate max-w-[100px] leading-tight">{user?.full_name || 'Partner'}</span>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    {kycApproved ? (
                      <span className="text-[#22C55E] flex items-center gap-0.5">
                        <Shield className="h-2 w-2" /> VERIFIED
                      </span>
                    ) : 'PENDING'}
                  </span>
                </div>
                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180 text-[#FF7A00]' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden z-50 animate-fade-in-up py-2 select-none">
                  <div className="px-4 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-bold text-slate-350">Status: <span className={workerStatus === 'ONLINE' ? 'text-[#22C55E]' : 'text-slate-400'}>{workerStatus}</span></p>
                  </div>
                  
                  <Link 
                    href="/worker/dashboard" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>

                  <Link 
                    href="/worker/jobs" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <Briefcase className="h-4 w-4" />
                    My Job Requests
                  </Link>

                  <Link 
                    href="/worker/location" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Live Route & Tracking
                  </Link>

                  <Link 
                    href="/worker/availability" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                    Duty Availability
                  </Link>

                  <Link 
                    href="/worker/settings" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <Link 
                    href="/worker/referrals" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Refer & Earn
                  </Link>

                  <Link 
                    href="/worker/kyc" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    KYC Uploads
                  </Link>

                  {kycApproved && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowIdCardModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors text-left cursor-pointer"
                    >
                      <IdCard className="h-4 w-4 text-[#FF7A00]" />
                      Digital ID Card
                    </button>
                  )}

                  <Link 
                    href="/worker/settings" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#070B14] hover:text-[#FF7A00] transition-colors border-b border-white/[0.06] pb-2 mb-1"
                  >
                    <Settings className="h-4 w-4" />
                    System Settings
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-[#EF4444]/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out Partner
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="flex-1 w-full bg-[#070B14] flex flex-col justify-start relative select-none">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 h-[400px] w-[500px] bg-[#FF7A00]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[500px] bg-[#0EA5E9]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 flex items-center justify-around select-none shadow-2xl">
        <Link
          href="/worker/dashboard"
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${
            pathname === '/worker/dashboard'
              ? 'text-[#FF7A00] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-black tracking-wider uppercase">Home</span>
        </Link>

        <Link
          href="/worker/jobs"
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${
            pathname === '/worker/jobs'
              ? 'text-[#FF7A00] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-[9px] font-black tracking-wider uppercase">Jobs</span>
        </Link>

        <Link
          href="/worker/location"
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${
            pathname === '/worker/location'
              ? 'text-[#FF7A00] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span className="text-[9px] font-black tracking-wider uppercase">Track</span>
        </Link>

        <Link
          href="/worker/settlements"
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${
            pathname === '/worker/settlements' || pathname === '/worker/wallet'
              ? 'text-[#FF7A00] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[9px] font-black tracking-wider uppercase">Wallet</span>
        </Link>

        <Link
          href="/worker/profile"
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${
            pathname === '/worker/profile' || pathname === '/worker/settings'
              ? 'text-[#FF7A00] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] font-black tracking-wider uppercase">Profile</span>
        </Link>
      </nav>

      {kycApproved && (
        <DigitalIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          worker={workerDetails}
          photoUrl={
            kycDocs.find(d => d.document_type === 'PROFILE_PHOTO')?.signedUrl 
              || kycDocs.find(d => d.document_type === 'SELFIE_VERIFICATION')?.signedUrl
          }
        />
      )}

    </div>
  );
}
