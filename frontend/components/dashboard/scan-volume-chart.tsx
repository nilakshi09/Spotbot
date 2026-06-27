'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  chartColors,
  tooltipStyle,
  axisTickStyle,
  chartDefaults,
} from '@/lib/chart-theme'
import { formatDateShort } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

interface ScanVolumeChartProps {
  data: Array<{ date: string; count: number }>
  isLoading: boolean
}

export function ScanVolumeChart({
  data,
  isLoading,
}: ScanVolumeChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  const totalScans = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          Scan Volume
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Last 14 days · {totalScans} total scans
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={chartDefaults.margin}>
          <defs>
            <linearGradient
              id="scanVolumeGradient"
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={axisTickStyle}
            tickFormatter={formatDateShort}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={25}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: any) => [`${value} scans`, 'Scans']}
            labelFormatter={(label) => formatDateShort(String(label))}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#scanVolumeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
