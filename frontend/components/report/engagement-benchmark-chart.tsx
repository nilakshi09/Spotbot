'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

import type { Platform, EngagementRateDetails } from '@/types/scan';

interface EngagementBenchmarkChartProps {
  details: EngagementRateDetails;
  platform: Platform;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#111820] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm text-white">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: entry.fill }} />
          {entry.name}: {entry.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

export default function EngagementBenchmarkChart({
  details,
  platform,
}: EngagementBenchmarkChartProps) {
  const isYouTube = platform === 'youtube';

  const subtitle = isYouTube
    ? `${details.niche} · ${details.tier} Channel`
    : `${details.niche} · ${details.tier} Influencer`;

  const erFormula = isYouTube
    ? 'ER = (Likes + Comments) / Views × 100'
    : 'ER = (Likes + Comments) / Followers × 100';

  const postsLabel = isYouTube ? 'Videos Analyzed' : 'Posts Analyzed';

  const chartData = [
    {
      name: 'Engagement Rate',
      'Your ER': details.accountER,
      Benchmark: details.benchmarkER,
    },
  ];

  const stats = [
    { label: 'Avg Likes', value: formatNumber(details.avgLikes) },
    { label: 'Avg Comments', value: formatNumber(details.avgComments) },
    ...(isYouTube && details.avgViews != null
      ? [{ label: 'Avg Views', value: formatNumber(details.avgViews) }]
      : []),
    { label: postsLabel, value: details.postsAnalyzed.toString() },
  ];

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-5 h-5 text-[#8899aa]" />
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          Engagement Benchmark
        </h3>
      </div>
      <p className="text-sm text-[#8899aa] mb-6">{subtitle}</p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#8899aa', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: '#8899aa', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="Your ER" fill="#00d4c8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Benchmark" fill="#4b5563" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* ER formula note */}
      <p className="text-xs text-gray-500 mt-3 text-center">{erFormula}</p>

      {/* YouTube-specific note */}
      {isYouTube && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Note: YouTube engagement is calculated against video views, not subscriber count
        </p>
      )}

      {/* Stats row */}
      <div className={`grid gap-3 mt-5 ${stats.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {stats.map((stat) => (
          <div key={stat.label} className="text-center bg-white/5 rounded-xl py-3 px-2">
            <p className="text-sm font-bold text-white">{stat.value}</p>
            <p className="text-xs text-[#8899aa] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
