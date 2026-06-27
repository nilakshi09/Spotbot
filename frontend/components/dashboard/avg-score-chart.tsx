'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  chartColors,
  tooltipStyle,
  axisTickStyle,
  chartDefaults,
} from '@/lib/chart-theme'
import { formatDateShort } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

interface AvgScoreChartProps {
  data: Array<{ date: string; avgScore: number | null }>
  isLoading: boolean
}

export function AvgScoreChart({ data, isLoading }: AvgScoreChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  // Filter out null values for display
  const chartData = data.filter(d => d.avgScore !== null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          Avg Fraud Score Trend
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Daily average across completed scans
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center
          text-gray-500 text-sm">
          Not enough data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={chartDefaults.margin}>
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
              domain={[0, 100]}
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={25}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any) =>
                value !== null ? [`${value}/100`, 'Avg Score'] : ['—', 'No data']
              }
              labelFormatter={(label) => formatDateShort(String(label))}
            />
            {/* Reference lines for risk thresholds */}
            <ReferenceLine
              y={30}
              stroke={chartColors.low}
              strokeDasharray="3 3"
              opacity={0.4}
            />
            <ReferenceLine
              y={60}
              stroke={chartColors.medium}
              strokeDasharray="3 3"
              opacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend for reference lines */}
      <div className="flex gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t border-dashed"
            style={{ borderColor: chartColors.low }} />
          <span className="text-xs text-gray-500">Clean (30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t border-dashed"
            style={{ borderColor: chartColors.medium }} />
          <span className="text-xs text-gray-500">Review (60)</span>
        </div>
      </div>
    </div>
  )
}
