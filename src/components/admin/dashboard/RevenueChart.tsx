'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  period: string;
  total_revenue: number;
  admin_commission: number;
  worker_share: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-5 select-none transition-all duration-300 hover:border-white/[0.12]">
      <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Revenue (Last 7 Days)</h3>
      <div className="h-72 w-full text-slate-350">
        {data.length > 0 ? (
          mounted && (
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis dataKey="period" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070B14', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'black', color: '#fff' }}
                  itemStyle={{ color: '#FF7A00', fontWeight: 'bold' }}
                />
                <Bar dataKey="total_revenue" name="Total Revenue (₹)" fill="#FF7A00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            No revenue records available.
          </div>
        )}
      </div>
    </div>
  );
}
