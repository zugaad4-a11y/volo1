'use client';

import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  
  // Optional Selection Props for Bulk Actions
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const handleSortClick = (key: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;
    const order = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, order);
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(data.map((r) => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string | number) => {
    e.stopPropagation(); // Prevent trigger row click
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#1F2937] bg-[#111827] shadow-xl relative max-h-[600px] overflow-y-auto no-scrollbar">
      <table className="w-full min-w-max border-collapse text-left text-sm text-slate-300">
        <thead className="sticky top-0 z-10 bg-[#0A0F1E] border-b border-[#1F2937] text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
          <tr>
            {/* Checkbox for Bulk Actions Header */}
            {onSelectionChange && (
              <th className="px-5 py-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-[#1F2937] text-[#FF8A00] focus:ring-[#FF8A00]/20 bg-[#0A0F1E] cursor-pointer"
                />
              </th>
            )}
            
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => handleSortClick(String(col.key), col.sortable)}
                className={`px-6 py-4.5 transition-colors duration-150 ${
                  col.sortable ? 'cursor-pointer hover:bg-white/[0.03] select-none text-white' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && onSort && (
                    <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                      {sortBy === String(col.key) ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F2937]/50 bg-[#111827]">
          {data.length > 0 ? (
            data.map((row) => {
              const isRowSelected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-all duration-200 border-b border-[#1F2937]/30 last:border-b-0 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${isRowSelected ? 'bg-[#FF8A00]/5 hover:bg-[#FF8A00]/10' : 'hover:bg-[#172033]'}`}
                >
                  {/* Checkbox Selection cell */}
                  {onSelectionChange && (
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={(e) => handleSelectRow(e, row.id)}
                        className="rounded border-[#1F2937] text-[#FF8A00] focus:ring-[#FF8A00]/20 bg-[#0A0F1E] cursor-pointer"
                      />
                    </td>
                  )}
                  
                  {columns.map((col, idx) => (
                    <td key={String(col.key)} className="px-6 py-4">
                      {col.render ? (
                        col.render(row)
                      ) : (
                        <span className={`font-semibold ${idx === 0 ? 'text-white font-bold' : 'text-slate-350'}`}>
                          {String(row[col.key as keyof T] ?? '')}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="px-6 py-20 text-center text-slate-500 font-bold uppercase tracking-wider text-xs bg-[#111827]">
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
