'use client'

import { useState, useEffect } from 'react'
import { Zap, RefreshCw, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/format'

interface CacheIndicatorProps {
  cached: boolean
  createdAt: string
  expiresAt: string | null
  scanId: string
  onRescan: () => void
  isRescanning: boolean
}

export function CacheIndicator({
  cached,
  createdAt,
  expiresAt,
  scanId,
  onRescan,
  isRescanning,
}: CacheIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState('')

  // Update countdown every minute
  useEffect(() => {
    function updateTimeLeft() {
      if (!expiresAt) return
      const expires = new Date(expiresAt)
      const now = new Date()
      const diffMs = expires.getTime() - now.getTime()

      if (diffMs <= 0) {
        setTimeLeft('expired')
        return
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60_000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500
      flex-wrap">

      {/* Cache status */}
      {cached && (
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Zap size={12} fill="currentColor" />
          <span>Cached result</span>
        </div>
      )}

      {/* Scan time */}
      <div className="flex items-center gap-1.5">
        <Clock size={12} />
        <span>Scanned {timeAgo(createdAt)}</span>
      </div>

      {/* Expiry countdown */}
      {expiresAt && timeLeft && timeLeft !== 'expired' && (
        <div className="flex items-center gap-1.5">
          <span>·</span>
          <span>Refreshes in {timeLeft}</span>
        </div>
      )}

      {/* Re-scan button */}
      <button
        onClick={onRescan}
        disabled={isRescanning}
        className="flex items-center gap-1.5 text-gray-400
          hover:text-white transition-colors disabled:opacity-50
          ml-auto"
      >
        <RefreshCw
          size={12}
          className={isRescanning ? 'animate-spin' : ''}
        />
        {isRescanning ? 'Rescanning...' : 'Re-scan'}
      </button>
    </div>
  )
}
