'use client';

import React from 'react';

interface FilterDropdownProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export default function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: FilterDropdownProps) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[140px] select-none">
      {label && <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-mono">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#FF8A00]/50 focus:ring-1 focus:ring-[#FF8A00]/25 transition-all duration-300 cursor-pointer font-bold"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111827] text-slate-200 font-bold">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
