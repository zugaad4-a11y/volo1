'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}

export default function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
}: SearchInputProps) {
  const [innerVal, setInnerVal] = useState(value);

  useEffect(() => {
    setInnerVal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(innerVal);
    }, 300);

    return () => clearTimeout(timer);
  }, [innerVal, onChange]);

  return (
    <div className="relative flex items-center w-full max-w-sm rounded-xl bg-[#0A0F1E] border border-[#1F2937] text-slate-300 focus-within:border-[#FF8A00]/50 focus-within:ring-1 focus-within:ring-[#FF8A00]/25 transition-all duration-300">
      <Search className="absolute left-3.5 text-slate-500 h-4 w-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={innerVal}
        onChange={(e) => setInnerVal(e.target.value)}
        className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-xs outline-none text-white placeholder-slate-600 font-bold"
      />
    </div>
  );
}
