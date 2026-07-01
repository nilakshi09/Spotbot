'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  chartColors,
  tooltipStyle,
  axisTickStyle,
  chartDefaults,
} from '@/lib/chart-theme'
import { Skeleton } from '@/components/ui/skeleton'

interface ScoreDistributionChartProps {
  data: Array<{ range: string; count: number }>
  isLoading: boolean
}

export function ScoreDistributionChart({
  data,
  isLoading,
}: ScoreDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  // Color each bar by risk level
  function getBarColor(range: string): string {
    if (range === '0-20' || range === '21-40') return chartColors.low
    if (range === '41-60') return chartColors.medium
    return chartColors.high
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          Score Distribution
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          How fraud scores break down across {total} scans
        </p>
      </div>

      {total === 0 ? (
        <div className="h-48 flex items-center justify-center
          text-gray-500 text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={chartDefaults.margin}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="range"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
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
              formatter={(value) => [`${value} scans`, 'Count']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.range)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
