'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Custom dark mode tooltip style
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161B26] border border-border p-3 rounded-lg shadow-glass">
        {label && <p className="text-xs font-semibold text-text-secondary mb-1">{label}</p>}
        {payload.map((pld: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: pld.color || pld.fill }}>
            {pld.name}: {pld.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==========================================
// 1. VOLUME OVER TIME AREA CHART
// ==========================================
interface VolumeData {
  date: string;
  count: number;
}

export function VolumeOverTimeChart({ data }: { data: VolumeData[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="Feedbacks"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#volumeGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// 2. SENTIMENT BREAKDOWN DONUT CHART
// ==========================================
interface SentimentData {
  name: string;
  value: number;
  color: string;
}

export function SentimentBreakdownChart({ data }: { data: SentimentData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-72 flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute text-center">
        <span className="text-xs text-text-secondary uppercase tracking-wider block font-medium">Total</span>
        <span className="text-3xl font-bold font-display text-text-primary block mt-0.5">
          {total}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 3. TOP THEMES HORIZONTAL BAR CHART
// ==========================================
interface ThemeBarData {
  name: string;
  count: number;
  color: string;
}

export function TopThemesChart({ data }: { data: ThemeBarData[] }) {
  // Truncate long theme names for tidy labels
  const processedData = data.map(item => ({
    ...item,
    displayName: item.name.length > 18 ? item.name.slice(0, 16) + '..' : item.name
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            stroke="#F3F4F6"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Feedbacks" radius={[0, 4, 4, 0]}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
