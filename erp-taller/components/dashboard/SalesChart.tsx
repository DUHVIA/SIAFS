"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: { name: string; total: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DB052B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DB052B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#747474" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#747474" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `$${value}`} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(26, 26, 26, 0.9)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              backdropFilter: 'blur(10px)'
            }}
            itemStyle={{ color: '#F3F3F3' }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#DB052B" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
