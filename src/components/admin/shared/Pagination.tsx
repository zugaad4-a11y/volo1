'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalResults,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startResult = (currentPage - 1) * limit + 1;
  const endResult = Math.min(currentPage * limit, totalResults);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1">
      <span className="text-xs text-slate-500 font-medium">
        Showing <span className="text-slate-300 font-semibold">{startResult}</span> to{' '}
        <span className="text-slate-300 font-semibold">{endResult}</span> of{' '}
        <span className="text-slate-300 font-semibold">{totalResults}</span> results
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 rounded-lg transition-colors select-none"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isCurrent = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border select-none ${
                isCurrent
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 rounded-lg transition-colors select-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
