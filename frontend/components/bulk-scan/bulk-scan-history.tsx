'use client'

import { FileSpreadsheet, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import type { BulkScan } from '@/types/bulk-scan'

interface BulkScanHistoryProps {
  bulkScans: BulkScan[]
  isLoading: boolean
  onViewProgress: (id: string) => void
}

export function BulkScanHistory({
  bulkScans,
  isLoading,
  onViewProgress,
}: BulkScanHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="px-6 py-4 border-b border-white/10">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-white/5">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (bulkScans.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-500 text-sm">
        No bulk scans yet. Create one above to see history.
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl
      overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">
          Bulk Scan History
        </h2>
      </div>

      {/* List */}
      <div className="divide-y divide-white/5">
        {bulkScans.map(bulkScan => (
          <BulkScanHistoryRow
            key={bulkScan.id}
            bulkScan={bulkScan}
            onView={() => onViewProgress(bulkScan.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── HISTORY ROW ──────────────────────────────────────────────────────────────

function BulkScanHistoryRow({
  bulkScan,
  onView,
}: {
  bulkScan: BulkScan
  onView: () => void
}) {
  const statusConfig = {
    pending: {
      label: 'Queued',
      color: 'text-gray-400',
      bg: 'bg-gray-400/10',
    },
    processing: {
      label: 'Processing',
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
    completed: {
      label: 'Completed',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    failed: {
      label: 'Failed',
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
  }

  const config = statusConfig[bulkScan.status]

  return (
    <button
      onClick={onView}
      className="w-full px-6 py-4 flex items-center gap-4
        hover:bg-white/3 transition-colors text-left"
    >
      {/* Icon */}
      <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center
        justify-center shrink-0">
        <FileSpreadsheet size={16} className="text-gray-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">
            {bulkScan.totalHandles} handles
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full
            ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {timeAgo(bulkScan.createdAt)}
          {bulkScan.status === 'processing' && (
            <> · {bulkScan.progressPct}% complete</>
          )}
          {bulkScan.status === 'completed' && (
            <> · {bulkScan.completedCount} succeeded,{' '}
              {bulkScan.failedCount} failed</>
          )}
        </div>
      </div>

      {/* Progress bar (inline, for processing state) */}
      {bulkScan.status === 'processing' && (
        <div className="w-24 h-1.5 bg-white/5 rounded-full
          overflow-hidden shrink-0">
          <div
            className="h-full bg-indigo-500 rounded-full
              transition-all duration-500"
            style={{ width: `${bulkScan.progressPct}%` }}
          />
        </div>
      )}

      {/* Chevron */}
      <ChevronRight size={16} className="text-gray-600 shrink-0" />
    </button>
  )
}
