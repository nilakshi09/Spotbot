'use client'

import { AlertTriangle } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { RiskBadge } from '@/components/ui/risk-badge'
import { formatNumber, scoreColor, formatDateShort } from '@/lib/format'
import type { TopFlaggedAccount } from '@/types/analytics'

interface TopFlaggedTableProps {
  accounts: TopFlaggedAccount[]
  isLoading: boolean
}

export function TopFlaggedTable({
  accounts,
  isLoading,
}: TopFlaggedTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl
      overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10
        flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-400" />
        <h2 className="text-base font-semibold text-white">
          Top Flagged Accounts
        </h2>
      </div>

      {accounts.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="No flagged accounts"
            description="No high-risk accounts found in this period"
          />
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider">
                Handle
              </th>
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider
                hidden sm:table-cell">
                Platform
              </th>
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider
                hidden sm:table-cell">
                Followers
              </th>
              <th className="text-left px-6 py-3 text-xs
                text-gray-500 uppercase tracking-wider
                hidden md:table-cell">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, i) => (
              <tr
                key={`${account.handle}-${i}`}
                className="border-b border-white/5 hover:bg-white/3
                  transition-colors"
              >
                <td className="px-6 py-3">
                  <span className="text-sm text-white font-mono">
                    @{account.handle}
                  </span>
                </td>
                <td className="px-6 py-3 hidden sm:table-cell">
                  <PlatformBadge platform={account.platform} size="sm" />
                </td>
                <td className="px-6 py-3">
                  <span className={`text-sm font-bold ${
                    scoreColor(account.fraudScore)
                  }`}>
                    {account.fraudScore}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <RiskBadge riskLevel={account.riskLevel} size="sm" />
                </td>
                <td className="px-6 py-3 hidden sm:table-cell">
                  <span className="text-sm text-gray-400">
                    {formatNumber(account.followers)}
                  </span>
                </td>
                <td className="px-6 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-500">
                    {formatDateShort(account.scanDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
