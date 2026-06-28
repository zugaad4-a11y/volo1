'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface BookingStatusChartProps {
  data: ChartData[];
}

const COLORS = ['#FF7A00', '#10b981', '#3b82f6', '#f59e0b', '#64748b', '#a855f7', '#06b6d4'];
 
export default function BookingStatusChart({ data }: BookingStatusChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-5 select-none transition-all duration-300 hover:border-white/[0.12]">
      <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Booking Status Distribution</h3>
      <div className="h-72 w-full text-slate-350">
        {data.length > 0 ? (
          mounted && (
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#070B14', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'black', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} fontSize={10} formatter={(value) => <span className="text-xs font-bold text-slate-400 font-mono">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            No booking status logs available.
          </div>
        )}
      </div>
    </div>
  );
}
