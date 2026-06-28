'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

interface AdminShellProps {
  children: React.ReactNode;
  adminName?: string;
  adminAvatar?: string;
}

export default function AdminShell({ children, adminName, adminAvatar }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('admin_sidebar_collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col font-sans selection:bg-[#FF8A00]/30 selection:text-white">
      <AdminTopbar 
        adminName={adminName} 
        adminAvatar={adminAvatar} 
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
      />
      <div className="flex flex-1 pt-16">
        <AdminSidebar 
          isCollapsed={isCollapsed} 
          onToggleCollapse={toggleCollapse} 
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
        {/* Backdrop for mobile drawer */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        <main 
          className={`flex-1 p-6 overflow-x-hidden transition-all duration-300 pl-0 lg:pl-16 ${
            isCollapsed ? '' : 'lg:pl-64'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
