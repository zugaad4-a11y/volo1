'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, User, MapPin, Sparkles, Briefcase, History, 
  CreditCard, Star, Settings, LogOut, Menu, X, Bell, Search, Wallet, Gift
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'Services', href: '/customer/services', icon: Sparkles },
  { name: 'My Bookings', href: '/customer/bookings', icon: Briefcase },
  { name: 'Volo Wallet', href: '/customer/wallet', icon: Wallet },
  { name: 'Addresses', href: '/customer/addresses', icon: MapPin },
  { name: 'Profile', href: '/customer/profile', icon: User },
  { name: 'History', href: '/customer/booking-history', icon: History },
  { name: 'Invoices', href: '/customer/invoices', icon: CreditCard },
  { name: 'My Reviews', href: '/customer/reviews', icon: Star },
  { name: 'Settings', href: '/customer/settings', icon: Settings },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Fetch wallet balance
  const { data: walletData } = useSWR('/api/customer/wallet', fetcher);
  const walletBalance = walletData ? Number(walletData.balance) : 0;
  
  // Dropdown / Navigation states
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/customer/alerts');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/customer/alerts', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    } finally {
      setNotifOpen(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/customer/login');
          return;
        }
        const data = await res.json();
        if (data.user?.role !== 'customer') {
          const fallback = data.user?.role === 'admin' ? '/admin/dashboard' : '/worker/dashboard';
          router.push(fallback);
          return;
        }
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying customer layout auth:', err);
        router.push('/customer/login');
      }
    }
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/customer/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/customer/services?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-white">
        <span className="h-10 w-10 border-4 border-amber-500/20 border-t-[#FF7A00] rounded-full animate-spin shadow-lg shadow-orange-500/10" />
        <p className="text-xs text-slate-400 mt-4 font-semibold tracking-wider uppercase animate-pulse">Checking authorization status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans antialiased selection:bg-orange-500/30 selection:text-white">
      
      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-[#070B14]/40 select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Branding */}
          <Link href="/customer/dashboard" className="flex items-center gap-2 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity active:scale-95 duration-200">
            <img 
              src="/images/logo.jpeg" 
              alt="VOLO Logo" 
              className="h-10 w-10 rounded-xl object-contain border border-white/[0.08] shadow-md" 
            />
            <div className="flex flex-col">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-white leading-none bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">VOLO</span>
              <span className="text-[8px] font-bold uppercase text-[#FF7A00] tracking-widest mt-0.5 leading-none font-mono hidden sm:block">Client Portal</span>
            </div>
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#FF7A00] transition-colors" />
            <input
              type="text"
              placeholder="Search home repairs, cleaning, plumbing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full bg-[#070B14]/60 border border-white/[0.08] focus:border-[#FF7A00]/50 focus:ring-4 focus:ring-orange-500/5 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition-all focus:bg-[#070B14] shadow-inner"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Wallet quick chip */}
            <Link
              href="/customer/wallet"
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-orange-500/10 border border-[#FF7A00]/25 hover:border-[#FF7A00]/50 rounded-2xl text-orange-400 hover:text-orange-300 transition-all text-xs font-black cursor-pointer shadow-lg shadow-orange-500/5"
            >
              <Wallet className="h-4 w-4 text-[#FF7A00]" />
              <span className="font-mono text-orange-300 hidden sm:inline">
                ₹{walletBalance.toFixed(2)}
              </span>
            </Link>

            {/* Notifications drop menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileMenuOpen(false);
                }}
                className="p-2 sm:p-3 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-2xl transition-all relative cursor-pointer active:scale-95"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 h-2 w-2 rounded-full bg-[#FF7A00]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-82 bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl py-4 z-50 animate-fade-in-up">
                  <div className="px-4 pb-3 border-b border-white/[0.06] flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Notifications</span>
                    <button 
                      type="button" 
                      onClick={handleClearNotifications} 
                      className="text-[10px] font-black text-[#FF7A00] hover:underline cursor-pointer"
                    >
                      Dismiss All
                    </button>
                  </div>
                  <div className="divide-y divide-white/[0.04] max-h-60 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-white/[0.02] text-left cursor-pointer transition-colors" onClick={() => setNotifOpen(false)}>
                          <p className="text-xs font-bold text-slate-200">{notif.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{notif.body}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500 font-semibold font-mono">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile menu dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-1.5 p-1 sm:p-1.5 hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl transition-all cursor-pointer active:scale-95"
              >
                <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-[#FF7A00]/30 flex items-center justify-center text-xs font-black uppercase text-[#FF7A00]">
                  {user?.full_name?.charAt(0) || 'C'}
                </div>
                <span className="hidden md:inline text-xs font-bold text-slate-350 max-w-[100px] truncate">{user?.full_name || 'Customer'}</span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-[#0F172A] border border-white/[0.08] rounded-2xl shadow-2xl py-3 z-50 animate-fade-in-up text-left select-none">
                  <div className="px-4 py-2.5 border-b border-white/[0.06]">
                    <p className="text-xs font-black text-white truncate">{user?.full_name || 'Customer'}</p>
                    <p className="text-[10px] text-slate-450 font-bold truncate font-mono mt-0.5">{user?.email || 'customer@volo.com'}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/customer/dashboard" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <LayoutDashboard className="h-4 w-4 text-slate-400" /> Dashboard
                    </Link>
                    <Link href="/customer/services" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <Sparkles className="h-4 w-4 text-slate-400" /> Book Services
                    </Link>
                    <Link href="/customer/bookings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <Briefcase className="h-4 w-4 text-slate-400" /> Manage Bookings
                    </Link>
                    <Link href="/customer/addresses" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <MapPin className="h-4 w-4 text-slate-400" /> Addresses
                    </Link>
                    <Link href="/customer/wallet" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <Wallet className="h-4 w-4 text-[#FF7A00]" /> Volo Wallet
                    </Link>
                    <Link href="/customer/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-colors">
                      <Settings className="h-4 w-4 text-slate-400" /> Account Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-400" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= PAGE CONTAINER ================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-12 animate-fade-in-up">
        {children}
      </main>

      {/* ================= APP-LIKE BOTTOM TAB NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-35 bg-[#0F172A]/90 backdrop-blur-xl border-t border-white/[0.08] px-3 py-3 flex items-center justify-around select-none shadow-2xl rounded-t-3xl">
        <Link
          href="/customer/dashboard"
          className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all ${
            pathname === '/customer/dashboard'
              ? 'text-[#FF7A00] scale-105 font-black bg-orange-500/10'
              : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Home</span>
        </Link>
        
        <Link
          href="/customer/bookings"
          className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all ${
            pathname === '/customer/bookings' || pathname === '/customer/booking-history'
              ? 'text-[#FF7A00] scale-105 font-black bg-orange-500/10'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Bookings</span>
        </Link>

        <Link
          href="/customer/bookings"
          className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all ${
            pathname.includes('/customer/bookings/')
              ? 'text-[#FF7A00] scale-105 font-black bg-orange-500/10'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Track</span>
        </Link>

        <Link
          href="/customer/wallet"
          className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all ${
            pathname === '/customer/wallet'
              ? 'text-[#FF7A00] scale-105 font-black bg-orange-500/10'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Wallet</span>
        </Link>

        <Link
          href="/customer/profile"
          className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all ${
            pathname === '/customer/profile'
              ? 'text-[#FF7A00] scale-105 font-black bg-orange-500/10'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Profile</span>
        </Link>
      </nav>

    </div>
  );
}
