'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-[#1F2937]/10 text-slate-400 border-[#1F2937]/20';

  if (['ONLINE', 'APPROVED', 'ACTIVE', 'SUCCESS', 'PAID', 'TRUE'].includes(norm)) {
    colorClasses = 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 shadow-[0_0_8px_rgba(34,197,94,0.06)]';
  } else if (['OFFLINE', 'PENDING', 'PENDING_ASSIGNMENT'].includes(norm)) {
    colorClasses = 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 shadow-[0_0_8px_rgba(245,158,11,0.06)]';
  } else if (['ON_JOB', 'PROCESSING', 'WORKER_ASSIGNED', 'WORKER_ACCEPTED', 'IN_PROGRESS'].includes(norm)) {
    colorClasses = 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 shadow-[0_0_8px_rgba(59,130,246,0.06)]';
  } else if (['SUSPENDED', 'REJECTED', 'FAILED', 'FALSE'].includes(norm)) {
    colorClasses = 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 shadow-[0_0_8px_rgba(239,68,68,0.06)]';
  } else if (['CANCELLED', 'WORKER_REJECTED'].includes(norm)) {
    colorClasses = 'bg-slate-950/40 text-slate-500 border-white/[0.04]';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border font-mono select-none ${colorClasses}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
