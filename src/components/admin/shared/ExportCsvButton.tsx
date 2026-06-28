'use client';

import React from 'react';
import Papa from 'papaparse';
import { Download } from 'lucide-react';

interface ExportCsvButtonProps {
  data: any[];
  filename?: string;
  disabled?: boolean;
}

export default function ExportCsvButton({
  data,
  filename = 'export.csv',
  disabled = false,
}: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 rounded-lg transition-colors select-none animate-fade-in"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
