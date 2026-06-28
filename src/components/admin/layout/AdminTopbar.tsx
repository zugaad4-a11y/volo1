'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, 
  Search, 
  Bell, 
  Plus, 
  User, 
  Settings, 
  ShieldAlert, 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  Globe,
  PlusCircle,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  X,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminTopbarProps {
  adminName?: string;
  adminAvatar?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function AdminTopbar({
  adminName = 'Super Admin',
  adminAvatar = '',
  isCollapsed = false,
  onToggleCollapse,
  onToggleMobileMenu
}: AdminTopbarProps) {
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Popover states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Operational alerts metrics states
  const [pendingKyc, setPendingKyc] = useState<number | null>(null);
  const [pendingBookings, setPendingBookings] = useState<number | null>(null);

  // Database search state
  const [dbResults, setDbResults] = useState<{
    workers: { name: string; url: string }[];
    customers: { name: string; url: string }[];
    bookings: { name: string; url: string }[];
  } | null>(null);
  const [searching, setSearching] = useState(false);

  // Fetch search results from database when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDbResults(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setDbResults(data);
        }
      } catch (err) {
        console.error('Global search fetch failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Refs for closing on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch operational alert metrics on mount/open
  useEffect(() => {
    async function fetchAlertStats() {
      try {
        const res = await fetch('/api/admin/dashboard/metrics');
        if (res.ok) {
          const data = await res.json();
          setPendingKyc(data.pending_kyc || 0);
          setPendingBookings(data.pending_bookings || 0);
        }
      } catch (err) {
        console.error('Failed to fetch admin topbar notifications:', err);
      }
    }
    fetchAlertStats();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchAlertStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search Results Groups (Mock results for operational navigation lookup)
  const searchResults = [
    { category: 'Workers', items: [
      { name: 'Praneeth (Electrician)', url: '/admin/workers' },
      { name: 'Onboard Pending Workers', url: '/admin/workers?kyc_status=PENDING' }
    ]},
    { category: 'Customers', items: [
      { name: 'View Customer Accounts', url: '/admin/customers' }
    ]},
    { category: 'Bookings', items: [
      { name: 'Dispatch & Manual Assignments', url: '/admin/manual-assignments' },
      { name: 'Active Booking Logs', url: '/admin/bookings' }
    ]},
    { category: 'Finance', items: [
      { name: 'Settle Worker Payouts', url: '/admin/settlements' },
      { name: 'Payment Transactions', url: '/admin/payments' }
    ]}
  ];

  // Hotkey listener for Ctrl+K global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside clicks to close popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSearchNavigate = (url: string) => {
    setShowSearchModal(false);
    setSearchQuery('');
    router.push(url);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-[#111827]/80 backdrop-blur-xl border-b border-[#1F2937] px-3 sm:px-6 flex items-center justify-between shadow-lg shadow-black/35 select-none no-print">
        {/* Brand Logo & Collapse Trigger toggle */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Hamburger Menu Toggle for Mobile/Tablet */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-[#1F2937] bg-[#0A0F1E] text-slate-400 hover:text-white hover:border-[#FF8A00]/40 transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-95 transition-opacity">
            <img 
              src="/images/logo.jpeg" 
              alt="VOLO Logo" 
              className="h-9 w-9 rounded-xl object-contain border border-white/[0.08] shadow-md ring-1 ring-[#FF8A00]/25" 
            />
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm sm:text-base text-white tracking-tight">VOLO</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A00] font-mono mt-0.5 hidden sm:block">Control Tower</span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar trigger (Ctrl + K) */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <button 
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between bg-[#0A0F1E] hover:bg-[#172033] border border-[#1F2937] text-slate-500 hover:text-slate-400 rounded-xl px-4 py-2 text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-slate-500" />
              <span className="font-bold">Search operations, bookings, or workers...</span>
            </div>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded bg-[#111827] border border-[#1F2937] px-1.5 font-mono text-[9px] font-black text-slate-500 leading-none">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right side operational widgets */}
        <div className="flex items-center gap-1.5 sm:gap-3.5">
          
          {/* Quick Search Button for Mobile */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="md:hidden p-2 bg-[#0A0F1E] border border-[#1F2937] rounded-xl text-slate-400 hover:text-[#FF8A00] cursor-pointer"
            title="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Quick Actions Dropdown Menu */}
          <div className="relative" ref={actionRef}>
            <button
              type="button"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-[#FF8A00] hover:bg-[#FF9F2E] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-950/20 active:scale-95 duration-150"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Quick Action</span>
              <ChevronDown className="h-3.5 w-3.5 hidden lg:inline" />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl p-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <span className="block px-3 py-1 text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider select-none">Platform Shortcuts</span>
                <Link
                  href="/admin/manual-assignments"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#172033] hover:text-white transition-colors"
                >
                  <PlusCircle className="h-4 w-4 text-[#FF8A00]" />
                  Create Booking
                </Link>
                <Link
                  href="/admin/workers"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#172033] hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-[#FF8A00]" />
                  Add Field Partner
                </Link>
                <Link
                  href="/admin/push-notify"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#172033] hover:text-white transition-colors"
                >
                  <Volume2 className="h-4 w-4 text-[#FF8A00]" />
                  Send Notification
                </Link>
              </div>
            )}
          </div>

          {/* Operational Notification Center Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border border-[#1F2937] bg-[#0A0F1E] text-slate-400 hover:text-[#FF8A00] transition-colors relative cursor-pointer active:scale-95 duration-150`}
            >
              <Bell className="h-4.5 w-4.5" />
              {((pendingKyc || 0) + (pendingBookings || 0)) > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#EF4444] text-[8px] font-black text-white flex items-center justify-center animate-pulse shadow-sm shadow-red-500/30">
                  {(pendingKyc || 0) + (pendingBookings || 0)}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl p-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center border-b border-[#1F2937] pb-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider font-mono">Operations Alerts</span>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-[#EF4444]/10 text-[#EF4444] font-mono">Action Required</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  <Link 
                    href="/admin/workers?kyc_status=PENDING"
                    onClick={() => setShowNotifications(false)}
                    className="flex gap-2.5 p-2 rounded-xl hover:bg-[#172033] border border-transparent hover:border-[#1F2937] transition-all"
                  >
                    <AlertTriangle className="h-4.5 w-4.5 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[11px]">
                      <p className="font-extrabold text-white">Pending KYC Approvals</p>
                      <p className="text-slate-450 leading-normal font-semibold">
                        {pendingKyc !== null ? `${pendingKyc} field worker(s)` : 'Workers'} waiting for document approval.
                      </p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/manual-assignments"
                    onClick={() => setShowNotifications(false)}
                    className="flex gap-2.5 p-2 rounded-xl hover:bg-[#172033] border border-transparent hover:border-[#1F2937] transition-all"
                  >
                    <Globe className="h-4.5 w-4.5 text-[#3B82F6] shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[11px]">
                      <p className="font-extrabold text-white">Unassigned Dispatch</p>
                      <p className="text-slate-450 leading-normal font-semibold">
                        {pendingBookings !== null ? `${pendingBookings} active booking(s)` : 'Bookings'} waiting for manual assignment.
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono">
                  <span>LAST AUDITED: JUST NOW</span>
                  <button type="button" onClick={() => setShowNotifications(false)} className="text-[#FF8A00] hover:text-[#FF9F2E]">CLOSE</button>
                </div>
              </div>
            )}
          </div>

          {/* Admin User Profile Options Menu */}
          <div className="relative sm:border-l sm:border-[#1F2937] sm:pl-3.5" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer group"
            >
              <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-[#FF8A00] to-[#FF9F2E] flex items-center justify-center text-white text-xs font-black overflow-hidden shadow ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                {adminAvatar ? (
                  <img src={adminAvatar} alt={adminName} className="object-cover h-full w-full" />
                ) : (
                  adminName.charAt(0).toUpperCase()
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-450 hidden sm:block transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2.5 w-52 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl p-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#1F2937] mb-1 select-none">
                  <p className="text-xs font-extrabold text-white truncate">{adminName}</p>
                  <p className="text-[9px] font-bold text-[#FF8A00] uppercase font-mono tracking-wider mt-0.5">Super Admin</p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-350 hover:bg-[#172033] hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/5 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-[#1F2937] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            
            {/* Header Input */}
            <div className="p-4 border-b border-[#1F2937] flex items-center gap-3 bg-[#0A0F1E]">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search database (e.g. workers, customer name, transaction)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-white placeholder-slate-500 font-bold"
              />
              <button
                type="button"
                onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                className="text-slate-500 hover:text-white p-1 hover:bg-[#172033] rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results Block */}
            <div className="p-4 overflow-y-auto max-h-80 space-y-4 font-sans no-scrollbar">
              {searching ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3.5 select-none">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF8A00]" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">Searching Database...</span>
                </div>
              ) : dbResults ? (
                <>
                  {/* Workers */}
                  {dbResults.workers.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block px-3 text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono">
                        Matching Workers
                      </span>
                      <div className="space-y-0.5">
                        {dbResults.workers.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSearchNavigate(item.url)}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-350 hover:bg-[#172033] hover:text-white transition-colors cursor-pointer"
                          >
                            {item.name}
                            <span className="text-[9px] font-black uppercase text-[#FF8A00] font-mono">View Profile</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {dbResults.customers.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block px-3 text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono">
                        Matching Customers
                      </span>
                      <div className="space-y-0.5">
                        {dbResults.customers.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSearchNavigate(item.url)}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-355 hover:bg-[#172033] hover:text-white transition-colors cursor-pointer"
                          >
                            {item.name}
                            <span className="text-[9px] font-black uppercase text-[#FF8A00] font-mono">View Profile</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookings */}
                  {dbResults.bookings.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block px-3 text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono">
                        Matching Bookings
                      </span>
                      <div className="space-y-0.5">
                        {dbResults.bookings.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSearchNavigate(item.url)}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-355 hover:bg-[#172033] hover:text-white transition-colors cursor-pointer"
                          >
                            {item.name}
                            <span className="text-[9px] font-black uppercase text-[#FF8A00] font-mono">View Dispatch</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state fallback */}
                  {dbResults.workers.length === 0 && dbResults.customers.length === 0 && dbResults.bookings.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                      No records found matching "{searchQuery}"
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Default Navigation Shortcuts */}
                  {searchResults.map((group) => {
                    const filteredItems = group.items.filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={group.category} className="space-y-1.5">
                        <span className="block px-3 text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono">
                          {group.category}
                        </span>
                        <div className="space-y-0.5">
                          {filteredItems.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => handleSearchNavigate(item.url)}
                              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-355 hover:bg-[#172033] hover:text-white transition-colors cursor-pointer"
                            >
                              {item.name}
                              <span className="text-[9px] font-black uppercase text-slate-500 font-mono">Open</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer tips */}
            <div className="p-3.5 border-t border-[#1F2937] bg-[#0A0F1E] flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold select-none">
              <span>↑↓ TO NAVIGATE • ENTER TO SELECT</span>
              <span>ESC TO CANCEL</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
