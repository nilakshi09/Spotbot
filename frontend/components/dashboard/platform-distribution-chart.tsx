'use client'

import { Camera, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface PlatformDistributionChartProps {
  data: {
    instagram: number
    youtube: number
  }
  isLoading: boolean
}

export function PlatformDistributionChart({
  data,
  isLoading,
}: PlatformDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    )
  }

  const total = data.instagram + data.youtube
  const igPct = total > 0
    ? Math.round((data.instagram / total) * 100)
    : 0
  const ytPct = total > 0 ? 100 - igPct : 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          Platform Split
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Last 30 days
        </p>
      </div>

      {total === 0 ? (
        <div className="h-20 flex items-center justify-center
          text-gray-500 text-sm">
          No scans yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* Instagram bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm text-white">
                <Camera size={14} className="text-pink-400" />
                Instagram
              </div>
              <div className="text-sm text-white font-medium">
                {data.instagram}
                <span className="text-gray-500 text-xs ml-1">
                  ({igPct}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r
                  from-pink-500 to-purple-600 transition-all duration-700"
                style={{ width: `${igPct}%` }}
              />
            </div>
          </div>

          {/* YouTube bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm text-white">
                <Play size={14} className="text-red-400" fill="currentColor" />
                YouTube
              </div>
              <div className="text-sm text-white font-medium">
                {data.youtube}
                <span className="text-gray-500 text-xs ml-1">
                  ({ytPct}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-red-600
                  transition-all duration-700"
                style={{ width: `${ytPct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
