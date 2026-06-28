'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  users?: { full_name: string } | null;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-5 select-none transition-all duration-300 hover:border-white/[0.12]">
      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-4">
        <Activity className="h-4.5 w-4.5 text-[#FF7A00]" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Recent System Activity</h3>
      </div>
 
      <div className="divide-y divide-white/[0.03] max-h-[350px] overflow-y-auto pr-1">
        {activities.length > 0 ? (
          activities.map((act) => {
            let relativeTime = 'Just now';
            try {
              relativeTime = formatDistanceToNow(new Date(act.created_at), { addSuffix: true });
            } catch (e) {}
            return (
              <div key={act.id} className="py-4 first:pt-0 flex flex-col gap-1.5 transition-all hover:bg-white/[0.01] px-2 rounded-xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-[#FF7A00] uppercase font-mono tracking-wider">{act.action.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 font-bold font-mono">{relativeTime}</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  Modified {act.target_type || 'system'}{' '}
                  {act.target_id && <code className="text-[10px] font-mono text-slate-500 bg-[#070B14] px-1.5 py-0.5 rounded border border-white/[0.03]">({act.target_id.slice(0, 8)})</code>}
                </p>
                <span className="text-[10px] text-slate-500 font-bold font-mono">
                  Action by {act.users?.full_name || 'System'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-12 text-xs font-bold uppercase tracking-wider">
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
}
