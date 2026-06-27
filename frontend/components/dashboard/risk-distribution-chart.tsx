'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { chartColors, tooltipStyle } from '@/lib/chart-theme'
import { Skeleton } from '@/components/ui/skeleton'

interface RiskDistributionChartProps {
  data: {
    low: number
    medium: number
    high: number
  }
  isLoading: boolean
}

export function RiskDistributionChart({
  data,
  isLoading,
}: RiskDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  const total = data.low + data.medium + data.high

  const chartData = [
    {
      name: 'Clean',
      value: data.low,
      color: chartColors.low,
    },
    {
      name: 'Review',
      value: data.medium,
      color: chartColors.medium,
    },
    {
      name: 'Suspicious',
      value: data.high,
      color: chartColors.high,
    },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          Risk Distribution
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Last 30 days · {total} scans
        </p>
      </div>

      {total === 0 ? (
        <div className="h-48 flex items-center justify-center
          text-gray-500 text-sm">
          No completed scans yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any, name: any) => [
                `${value} scans (${Math.round((Number(value) / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Custom legend */}
      <div className="flex justify-center gap-4 mt-2">
        {[
          { label: 'Clean', color: chartColors.low, value: data.low },
          { label: 'Review', color: chartColors.medium, value: data.medium },
          { label: 'Suspicious', color: chartColors.high, value: data.high },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-400">
              {item.label}
            </span>
            <span className="text-xs text-white font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
