'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Search, Sparkles, Clock, AlertCircle, Loader2, 
  ArrowRight, ShieldCheck, HelpCircle 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CustomerServicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories and service items
  const url = `/api/customer/services?` + 
    (selectedCategory ? `categoryId=${selectedCategory}&` : '') + 
    (searchQuery ? `search=${encodeURIComponent(searchQuery)}` : '');

  const { data, error, isLoading } = useSWR(url, fetcher);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none hover-scale">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-orange-500/10 blur-3xl rounded-full" />
        <h2 className="font-display text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FF7A00] animate-pulse" />
          Explore Services
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Find vetted technicians for quick home installations and repairs.</p>
      </div>

      {/* Search and Categories Box */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-4">
        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-[#FF7A00] transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search home repairs, cleaning, plumbing..."
            className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 font-semibold outline-none transition-all focus:ring-4 focus:ring-orange-500/5 shadow-inner"
          />
        </div>

        {/* Categories Horizontal Scroller */}
        <div className="space-y-2 select-none">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-1 font-mono">Categories</span>
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer hover-scale-btn ${
                selectedCategory === null
                  ? 'bg-[#FF7A00] border-[#FF7A00] text-white shadow-lg shadow-orange-500/15'
                  : 'bg-[#070B14] border-white/[0.08] text-slate-400 hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              All Services
            </button>
            {data?.categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer hover-scale-btn ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF7A00] border-[#FF7A00] text-white shadow-lg shadow-orange-500/15'
                    : 'bg-[#070B14] border-white/[0.08] text-slate-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid/List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-405">
          <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider font-mono">Finding services...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center text-xs text-red-400 font-semibold font-mono">
          Failed to load service items.
        </div>
      ) : !data.items || data.items.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-10 text-center select-none space-y-4 hover-scale">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-[#FF7A00]/20 flex items-center justify-center mx-auto shadow-sm text-[#FF7A00]">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h4 className="font-display font-black text-white text-sm">No services found</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-semibold">Try modifying your search or select another category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {data.items.map((item: any) => (
            <div
              key={item.id}
              onClick={() => router.push(`/customer/services/${item.id}`)}
              className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer hover-scale hover:border-[#FF7A00]/40 transition-all duration-300 group shadow-md shadow-[#070B14]/40"
            >
              <div className="space-y-2 min-w-0">
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-[#070B14] text-slate-400 border border-white/[0.06] font-mono">
                  {item.service_categories?.name || 'Home Maintenance'}
                </span>
                <h3 className="font-display font-bold text-sm text-white truncate leading-snug group-hover:text-[#FF7A00] transition-colors">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-1 max-w-sm font-semibold">{item.description}</p>
                )}
                <div className="flex items-center gap-4 pt-1 font-semibold select-none font-mono text-[10px]">
                  <span className="text-xs font-black text-[#FF7A00]">
                    {formatCurrency(item.base_price)}
                  </span>
                  <span className="text-slate-450 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                    {item.estimated_mins} mins
                  </span>
                </div>
              </div>

              <div className="h-9 w-9 rounded-full bg-[#070B14] border border-white/[0.08] group-hover:bg-[#FF7A00] group-hover:border-[#FF7A00] flex items-center justify-center shrink-0 transition-all shadow-sm">
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
