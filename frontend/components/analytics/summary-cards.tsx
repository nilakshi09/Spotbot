'use client'

import { Activity, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, scoreColor } from '@/lib/format'
import type { AnalyticsSummary } from '@/types/analytics'

interface SummaryCardsProps {
  summary: AnalyticsSummary | undefined
  isLoading: boolean
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const cards = [
    {
      icon: Activity,
      label: 'Total Scans',
      value: summary?.totalScans ?? 0,
      formatter: (v: number) => v.toString(),
      color: 'text-white',
    },
    {
      icon: TrendingUp,
      label: 'Avg Fraud Score',
      value: summary?.avgFraudScore ?? 0,
      formatter: (v: number) => v.toString(),
      color: summary ? scoreColor(summary.avgFraudScore) : 'text-white',
    },
    {
      icon: AlertTriangle,
      label: 'High Risk Found',
      value: summary?.highRiskCount ?? 0,
      formatter: (v: number) =>
        `${v} (${summary?.highRiskPct ?? 0}%)`,
      color: (summary?.highRiskCount ?? 0) > 0
        ? 'text-red-400'
        : 'text-green-400',
    },
    {
      icon: Users,
      label: 'Est. Reach Analyzed',
      value: summary?.totalEstimatedReach ?? 0,
      formatter: formatNumber,
      color: 'text-white',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="bg-white/5 border border-white/10 rounded-xl p-5"
        >
          {isLoading ? (
            <>
              <Skeleton className="w-8 h-8 rounded-lg mb-3" />
              <Skeleton className="h-6 w-16 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-white/5 rounded-lg
                flex items-center justify-center mb-3">
                <card.icon size={16} className="text-gray-400" />
              </div>
              <div className={`text-xl font-bold ${card.color}`}>
                {card.formatter(card.value)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {card.label}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
