'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getLabel } from '@/lib/platform-labels';
import type { Platform, FollowerHistoryPoint } from '@/types/scan';

interface FollowerGrowthChartProps {
  data?: FollowerHistoryPoint[];
  platform: Platform;
}

function formatAxisNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  platform: Platform;
}

function ChartTooltip({ active, payload, label, platform }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const followerLabel = getLabel(platform, 'followers');

  return (
    <div className="bg-[#111820] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8899aa]">{label}</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value.toLocaleString()} {followerLabel}
      </p>
    </div>
  );
}

export default function FollowerGrowthChart({
  data,
  platform,
}: FollowerGrowthChartProps) {
  const title = getLabel(platform, 'followerHistoryLabel');
  const isYouTube = platform === 'youtube';
  const strokeColor = isYouTube ? '#ef4444' : '#00d4c8';
  const gradientId = `followerGradient-${platform}`;

  const isEmpty = !data || data.length === 0;

  const emptyMessage = isYouTube
    ? 'Subscriber growth tracking coming soon'
    : 'Historical follower data unavailable';

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-[#8899aa]" />
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          {title}
        </h3>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className={`text-sm ${isYouTube ? 'text-[#8899aa]' : 'text-[#8899aa]'}`}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8899aa', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxisNumber}
              tick={{ fill: '#8899aa', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip platform={platform} />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
