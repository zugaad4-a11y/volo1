'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HardHat,
  Users,
  CalendarCheck,
  Wrench,
  GitBranch,
  Banknote,
  BarChart3,
  Settings,
  Shield,
  Wallet,
  CreditCard,
  Bell,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarCategory {
  title: string;
  items: SidebarItem[];
}

const navigationCategories: SidebarCategory[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Workers', href: '/admin/workers', icon: HardHat },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Manual Assignments', href: '/admin/manual-assignments', icon: GitBranch },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Wallets', href: '/admin/wallets', icon: Wallet },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Settlements', href: '/admin/settlements', icon: Banknote },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
      { label: 'Push Notifications', href: '/admin/push-notify', icon: Bell },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ 
  isCollapsed, 
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/admin/queued-bookings?page=1&limit=1');
        if (res.ok) {
          const data = await res.json();
          setUnassignedCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unassigned count for sidebar:', err);
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <aside 
      className={`fixed bottom-0 left-0 top-16 z-20 flex flex-col border-r border-[#1F2937] bg-[#111827] text-slate-400 select-none transition-all duration-300 ease-in-out w-64 ${
        isMobileOpen 
          ? 'translate-x-0' 
          : '-translate-x-full lg:translate-x-0'
      } ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}
    >
      <nav className="flex-1 space-y-6 px-3 py-6 overflow-y-auto no-scrollbar">
        {navigationCategories.map((category) => (
          <div key={category.title} className="space-y-1.5">
            {/* Category header - hidden on collapsed/small viewports */}
            <h4 
              className={`text-[10px] font-black uppercase tracking-widest text-[#64748B] px-3 font-mono transition-opacity duration-200 ${
                isCollapsed ? 'lg:opacity-0 lg:h-0 overflow-hidden' : 'opacity-100'
              }`}
            >
              {category.title}
            </h4>
            
            <div className="space-y-1">
              {category.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 active:scale-98 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF9F2E] text-white shadow-lg shadow-orange-950/20 scale-[1.01]'
                        : 'hover:bg-[#172033] hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:scale-105 group-hover:text-[#FF8A00]'}`} />
                      <span 
                        className={`truncate transition-all duration-300 ${
                          isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Badge counts (unassigned count in manual assignments) */}
                    {item.label === 'Manual Assignments' && unassignedCount !== null && unassignedCount > 0 && (
                      <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-black text-white ring-1 ring-white/10 animate-pulse shrink-0">
                        {unassignedCount}
                      </span>
                    )}

                    {/* Popover tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full ml-4 z-50 px-2.5 py-1.5 rounded-lg bg-[#0A0F1E] border border-[#1F2937] text-white text-[10px] font-bold tracking-wide uppercase opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-xl whitespace-nowrap hidden lg:block">
                        {item.label}
                        {item.label === 'Manual Assignments' && unassignedCount !== null && unassignedCount > 0 && (
                          <span className="ml-1.5 px-1 py-0.5 rounded bg-[#EF4444] text-[8px] font-black text-white">
                            {unassignedCount}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse controls toggle footer */}
      <div className="border-t border-[#1F2937] p-3 flex justify-center lg:justify-between items-center bg-[#111827] no-print">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center p-2 rounded-xl border border-[#1F2937] bg-[#0A0F1E] text-slate-400 hover:text-white hover:border-[#FF8A00]/40 transition-all cursor-pointer hover:bg-[#111827] active:scale-95 duration-150"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>
        {!isCollapsed && (
          <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider hidden lg:block">
            VOLO V1.0.0
          </span>
        )}
      </div>
    </aside>
  );
}
