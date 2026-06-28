'use client';

import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function LoadingSkeleton({ rows = 5, cols = 5 }: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900 border border-slate-800 rounded-lg w-full" />
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex gap-4">
          {Array.from({ length: cols }).map((_, idx) => (
            <div key={idx} className="h-4 bg-slate-800 rounded w-full" />
          ))}
        </div>
        <div className="divide-y divide-slate-800/50">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="px-5 py-4 flex gap-4">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <div key={cIdx} className="h-4 bg-slate-800/60 rounded w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
