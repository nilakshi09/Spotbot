'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
} from 'lucide-react'
import { useBulkScan, useBulkScanProgress, useDownloadBulkResults } from '@/hooks/use-bulk-scan'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import type { BulkHandle } from '@/types/bulk-scan'

function scoreColor(score: number) {
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-green-400';
}
import Link from 'next/link'

interface BulkScanProgressProps {
  bulkScanId: string
  onComplete?: () => void
}

export function BulkScanProgress({
  bulkScanId,
  onComplete,
}: BulkScanProgressProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: bulkScan, isLoading } = useBulkScan(bulkScanId)
  const { data: progress } = useBulkScanProgress(
    bulkScanId,
    bulkScan?.status !== 'completed' &&
      bulkScan?.status !== 'failed',
  )
  const downloadResults = useDownloadBulkResults()

  const isProcessing =
    bulkScan?.status === 'pending' ||
    bulkScan?.status === 'processing'

  const isCompleted = bulkScan?.status === 'completed'
  const isFailed = bulkScan?.status === 'failed'

  // When completed, invalidate queries and notify
  useEffect(() => {
    if (isCompleted) {
      queryClient.invalidateQueries({ queryKey: ['bulk-scans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      onComplete?.()
    }
  }, [isCompleted, queryClient, onComplete])

  async function handleDownload() {
    try {
      await downloadResults.mutateAsync(bulkScanId)
      toast.success('Results downloaded successfully')
    } catch {
      toast.error('Failed to download results')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!bulkScan) return null

  const currentProgress = progress ?? {
    completedCount: bulkScan.completedCount,
    failedCount: bulkScan.failedCount,
    progressPct: bulkScan.progressPct,
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl
      overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Bulk Scan
              {isProcessing && (
                <span className="ml-2 text-xs text-indigo-400
                  font-normal animate-pulse">
                  Processing...
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Started {timeAgo(bulkScan.createdAt)}
              {bulkScan.completedAt && (
                <> · Completed {timeAgo(bulkScan.completedAt)}</>
              )}
            </p>
          </div>

          {/* Download button */}
          {isCompleted && (
            <button
              onClick={handleDownload}
              disabled={downloadResults.isPending}
              className="flex items-center gap-2 px-4 py-2
                bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                text-white text-sm font-medium rounded-xl
                transition-colors"
            >
              <Download size={14} />
              {downloadResults.isPending
                ? 'Downloading...'
                : 'Download CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle size={14} />
              {currentProgress.completedCount} completed
            </span>
            {currentProgress.failedCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-400">
                <XCircle size={14} />
                {currentProgress.failedCount} failed
              </span>
            )}
            <span className="text-gray-500">
              of {bulkScan.totalHandles} total
            </span>
          </div>
          <span className="text-sm font-medium text-white">
            {currentProgress.progressPct}%
          </span>
        </div>

        {/* Progress track */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isFailed ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${currentProgress.progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Status message */}
        {isProcessing && (
          <p className="text-xs text-gray-500 mt-2">
            Each handle is analyzed individually.
            This may take a few minutes for large batches.
          </p>
        )}
        {isCompleted && (
          <p className="text-xs text-green-400 mt-2">
            ✅ All scans complete. Download your results above.
          </p>
        )}
      </div>

      {/* Results table */}
      {bulkScan.handles && bulkScan.handles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs
                  text-gray-500 uppercase tracking-wider">
                  Handle
                </th>
                <th className="text-left px-6 py-3 text-xs
                  text-gray-500 uppercase tracking-wider">
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
                  text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {bulkScan.handles.map((item, index) => (
                <BulkHandleRow key={index} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── BULK HANDLE ROW ──────────────────────────────────────────────────────────

function BulkHandleRow({ item }: { item: BulkHandle }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/3
      transition-colors">

      {/* Handle */}
      <td className="px-6 py-3">
        <span className="text-sm text-white font-mono">
          @{item.handle}
        </span>
      </td>

      {/* Platform */}
      <td className="px-6 py-3">
        <PlatformBadge platform={item.platform} size="sm" />
      </td>

      {/* Score */}
      <td className="px-6 py-3">
        {item.fraudScore !== undefined ? (
          <span className={`text-sm font-bold ${
            scoreColor(item.fraudScore)
          }`}>
            {item.fraudScore}
          </span>
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>

      {/* Risk */}
      <td className="px-6 py-3">
        {item.riskLevel ? (
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
            item.riskLevel === 'high' ? 'bg-red-400/10 text-red-400' :
            item.riskLevel === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
            'bg-green-400/10 text-green-400'
          }`}>
            {item.riskLevel}
          </span>
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-3">
        <StatusBadge status={item.status} error={item.error} />
      </td>

      {/* View report link */}
      <td className="px-6 py-3">
        {item.scanId && item.status === 'completed' && (
          <Link
            href={`/scan/${item.scanId}`}
            className="text-indigo-400 hover:text-indigo-300
              transition-colors"
          >
            <ExternalLink size={14} />
          </Link>
        )}
      </td>
    </tr>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  error,
}: {
  status: BulkHandle['status']
  error?: string
}) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs
        text-green-400">
        <CheckCircle size={12} />
        Done
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-red-400"
        title={error}
      >
        <XCircle size={12} />
        Failed
      </span>
    )
  }

  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs
        text-indigo-400">
        <div className="w-3 h-3 border border-indigo-400
          border-t-transparent rounded-full animate-spin" />
        Scanning
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs
      text-gray-500">
      <Clock size={12} />
      Queued
    </span>
  )
}
