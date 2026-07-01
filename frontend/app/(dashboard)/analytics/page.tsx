'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useAnalytics, useExportAnalytics } from '@/hooks/use-analytics'
import { useToast } from '@/hooks/use-toast'
import { UpgradeWall } from '@/components/billing/upgrade-wall'
import { SummaryCards } from '@/components/analytics/summary-cards'
import { ScanVolumeChart } from '@/components/dashboard/scan-volume-chart'
import { RiskDistributionChart } from '@/components/dashboard/risk-distribution-chart'
import { AvgScoreChart } from '@/components/dashboard/avg-score-chart'
import { ScoreDistributionChart } from '@/components/analytics/score-distribution-chart'
import { TopFlaggedTable } from '@/components/analytics/top-flagged-table'
import { BarChart3, Download } from 'lucide-react'
import type { AnalyticsRange } from '@/types/analytics'

export default function AnalyticsPage() {
  const { data: stats } = useDashboardStats()
  const [range, setRange] = useState<AnalyticsRange>('30d')
  const { data: analytics, isLoading } = useAnalytics(range)
  const exportAnalytics = useExportAnalytics()
  const { toast } = useToast()

  const isAllowed = ['pro', 'enterprise'].includes(
    stats?.planName ?? ''
  )

  if (!isAllowed && stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="mt-8">
          <UpgradeWall
            used={stats.scansUsed}
            limit={stats.scanLimit}
            plan={stats.planName}
            customMessage="Advanced analytics is available on Pro and Enterprise plans."
          />
        </div>
      </div>
    )
  }

  async function handleExport() {
    try {
      await exportAnalytics.mutateAsync(range)
      toast.success('Analytics exported successfully')
    } catch (err: any) {
      toast.error(err.message ?? 'Export failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader />

        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex bg-white/5 border border-white/10
            rounded-xl p-1">
            {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm
                  font-medium transition-colors ${
                  range === r
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === '7d' ? '7 days'
                  : r === '30d' ? '30 days'
                  : '90 days'}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exportAnalytics.isPending}
            className="flex items-center gap-2 px-4 py-2
              border border-white/10 hover:border-white/20
              text-gray-300 hover:text-white text-sm
              rounded-xl transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exportAnalytics.isPending ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards
        summary={analytics?.summary}
        isLoading={isLoading}
      />

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScanVolumeChart
          data={analytics?.scanVolumeTrend ?? []}
          isLoading={isLoading}
        />
        <AvgScoreChart
          data={analytics?.avgScoreTrend ?? []}
          isLoading={isLoading}
        />
        <RiskDistributionChart
          data={analytics?.riskDistribution ?? { low: 0, medium: 0, high: 0 }}
          isLoading={isLoading}
        />
        <ScoreDistributionChart
          data={analytics?.scoreDistribution ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Top flagged accounts */}
      <TopFlaggedTable
        accounts={analytics?.topFlaggedAccounts ?? []}
        isLoading={isLoading}
      />
    </div>
  )
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center
        gap-3">
        <BarChart3 size={22} className="text-cyan-400" />
        Analytics
      </h1>
      <p className="text-gray-400 text-sm mt-1">
        Deep insights into your fraud detection activity
      </p>
    </div>
  )
}
