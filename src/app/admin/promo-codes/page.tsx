'use client';
 
import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Loader2, CheckCircle, ToggleLeft, ToggleRight, Trash2, AlertTriangle, Coins, Percent, Ticket } from 'lucide-react';
import StatCard from '@/components/admin/dashboard/StatCard';
import DataTable, { Column } from '@/components/admin/shared/DataTable';
import StatusBadge from '@/components/admin/shared/StatusBadge';
 
interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  applicable_role: string;
  valid_from: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}
 
export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // Form state
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'FLAT' as 'FLAT' | 'PERCENT',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    max_uses: '',
    applicable_role: 'customer',
    expires_at: '',
  });
 
  async function fetchCodes() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      setCodes(data.promo_codes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => { 
    fetchCodes(); 
  }, []);
 
  const handleCreate = async () => {
    if (!form.code || !form.discount_value) { 
      setError('Code and discount value are required.'); 
      return; 
    }
    setSaving(true); 
    setError(null);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          discount_value: Number(form.discount_value),
          min_order_amount: Number(form.min_order_amount || 0),
          max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setShowCreate(false);
      setForm({ code: '', description: '', discount_type: 'FLAT', discount_value: '', min_order_amount: '', max_discount_amount: '', max_uses: '', applicable_role: 'customer', expires_at: '' });
      fetchCodes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
 
  const toggleActive = async (id: string, active: boolean) => {
    await fetch('/api/admin/promo-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchCodes();
  };
 
  const deleteCode = async (id: string) => {
    if (!confirm('Deactivate this promo code?')) return;
    await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' });
    fetchCodes();
  };
 
  const isExpired = (code: PromoCode) =>
    code.expires_at ? new Date(code.expires_at) < new Date() : false;
 
  const usagePercent = (code: PromoCode) =>
    code.max_uses ? Math.round((code.used_count / code.max_uses) * 100) : null;
 
  // Calculate KPI values
  const activeCodesCount = codes.filter(code => code.active && !isExpired(code)).length;
  const totalUsesCount = codes.reduce((acc, code) => acc + code.used_count, 0);
  const inactiveOrExpiredCount = codes.filter(code => !code.active || isExpired(code)).length;
 
  // Define columns for DataTable
  const columns: Column<PromoCode>[] = [
    {
      key: 'code',
      header: 'Promo Code',
      render: (row) => (
        <div>
          <p className="font-mono font-black text-white tracking-wider text-sm select-all">{row.code}</p>
          {row.description && <p className="text-slate-400 text-[10px] mt-0.5 font-medium">{row.description}</p>}
        </div>
      )
    },
    {
      key: 'discount_value',
      header: 'Discount Details',
      render: (row) => (
        <div>
          <span className="font-black text-brand-primary text-sm">
            {row.discount_type === 'PERCENT' ? `${row.discount_value}%` : `₹${row.discount_value}`}
          </span>
          <div className="flex gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {row.min_order_amount > 0 && <span>min ₹{row.min_order_amount}</span>}
            {row.max_discount_amount && <span>max ₹{row.max_discount_amount}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'used_count',
      header: 'Redemptions',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-bold text-white font-mono">{row.used_count}{row.max_uses ? ` / ${row.max_uses}` : ' / ∞'}</p>
          {usagePercent(row) !== null && (
            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, usagePercent(row) || 0)}%` }} 
              />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'applicable_role',
      header: 'Target User',
      render: (row) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize font-mono ${
          row.applicable_role === 'customer' ? 'bg-blue-900/20 text-blue-400 border-blue-900/40' :
          row.applicable_role === 'worker' ? 'bg-amber-900/20 text-amber-400 border-amber-900/40' :
          'bg-slate-800 text-slate-400 border-slate-700'
        }`}>{row.applicable_role}</span>
      )
    },
    {
      key: 'expires_at',
      header: 'Expiry Date',
      render: (row) => (
        <div className="text-xs">
          {row.expires_at ? (
            <span className={`font-medium ${isExpired(row) ? 'text-red-400 font-bold flex items-center gap-1' : 'text-slate-400'}`}>
              {isExpired(row) && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
              {new Date(row.expires_at).toLocaleDateString([], { dateStyle: 'medium' })}
            </span>
          ) : (
            <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">No Limit</span>
          )}
        </div>
      )
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => {
        const statusStr = isExpired(row) ? 'REJECTED' : row.active ? 'ACTIVE' : 'FAILED';
        // Overrides mapping to StatusBadge color schemes:
        // APPROVED / ACTIVE = green
        // PENDING = amber
        // REJECTED = red (Expired)
        // FAILED = red (Inactive)
        return (
          <StatusBadge status={statusStr} />
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleActive(row.id, row.active)}
            title={row.active ? 'Deactivate' : 'Activate'}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {row.active ? <ToggleRight className="w-6 h-6 text-brand-primary" /> : <ToggleLeft className="w-6 h-6 text-slate-650" />}
          </button>
          <button
            onClick={() => deleteCode(row.id)}
            className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      )
    }
  ];
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white select-none flex items-center gap-2.5">
            <Ticket className="w-6.5 h-6.5 text-brand-primary" />
            Promo Configurations
          </h1>
          <p className="text-slate-450 text-xs select-none">Create, configure, and manage coupon campaigns for customer checkout discounts.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-brand-primary/10 cursor-pointer active:scale-95 duration-150"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>
 
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Promo Codes"
          value={codes.length}
          icon={<Tag className="h-5 w-5" />}
          color="violet"
          description="Campaigns registered"
        />
        <StatCard
          title="Active Coupons"
          value={activeCodesCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="emerald"
          trend={{ value: 'Live', isPositive: true }}
          description="Available at checkout"
        />
        <StatCard
          title="Total Redemptions"
          value={totalUsesCount}
          icon={<Coins className="h-5 w-5" />}
          color="blue"
          description="Total discounts claimed"
        />
        <StatCard
          title="Expired / Suspended"
          value={inactiveOrExpiredCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="rose"
          trend={inactiveOrExpiredCount > 0 ? { value: 'Review', isPositive: false } : undefined}
          description="Out of service"
        />
      </div>
 
      {/* Codes Table Wrapper */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-450 space-y-3 bg-[#111827] border border-[#1F2937] rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-bold uppercase tracking-widest font-mono">Fetching active campaigns...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={codes}
          emptyMessage="No promotional coupon campaigns created yet."
        />
      )}
 
      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-brand-primary" />
                Configure Coupon Campaign
              </h3>
              <button 
                onClick={() => setShowCreate(false)} 
                className="p-1 hover:bg-[#172033] rounded text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}
 
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-widest font-mono">Promo Code *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. VOLOHOME50"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-sm font-mono text-white outline-none transition-all uppercase font-bold"
                />
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-widest font-mono">Discount Type *</label>
                <select
                  value={form.discount_type}
                  onChange={e => setForm(p => ({ ...p, discount_type: e.target.value as any }))}
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-semibold"
                >
                  <option value="FLAT">Flat (₹)</option>
                  <option value="PERCENT">Percent (%)</option>
                </select>
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-widest font-mono">
                  Discount Value * {form.discount_type === 'PERCENT' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number" 
                  min={0}
                  value={form.discount_value}
                  onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'PERCENT' ? '10' : '100'}
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-bold font-mono"
                />
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Min Order (₹)</label>
                <input
                  type="number" 
                  min={0}
                  value={form.min_order_amount}
                  onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-bold font-mono"
                />
              </div>
 
              {form.discount_type === 'PERCENT' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Max Discount (₹)</label>
                  <input
                    type="number" 
                    min={0}
                    value={form.max_discount_amount}
                    onChange={e => setForm(p => ({ ...p, max_discount_amount: e.target.value }))}
                    placeholder="500"
                    className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-bold font-mono"
                  />
                </div>
              )}
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Max Uses (optional)</label>
                <input
                  type="number" 
                  min={1}
                  value={form.max_uses}
                  onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-bold font-mono"
                />
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Target Users</label>
                <select
                  value={form.applicable_role}
                  onChange={e => setForm(p => ({ ...p, applicable_role: e.target.value }))}
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-semibold"
                >
                  <option value="customer">Customers</option>
                  <option value="worker">Workers</option>
                  <option value="all">Everyone</option>
                </select>
              </div>
 
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Expiry Date</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all font-semibold"
                />
              </div>
 
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-widest font-mono">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Diwali festive campaign discount offer"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-brand-primary/55 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all font-semibold"
                />
              </div>
            </div>
 
            <div className="flex gap-3 pt-4 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-slate-400 bg-transparent border border-[#1F2937] hover:bg-[#172033] rounded-xl transition-all cursor-pointer select-none active:scale-95 duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10 select-none active:scale-95 duration-150"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
