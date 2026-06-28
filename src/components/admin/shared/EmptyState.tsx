'use client';

import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionButton?: React.ReactNode;
}

export default function EmptyState({
  title = 'No records found',
  message = 'There is no data matching your query criteria at this time.',
  actionButton,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-xl text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-500">
        <Database className="h-5 w-5" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
}
