'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { getLabel } from '@/lib/platform-labels';
import type { Platform } from '@/types/scan';

interface RealReachProps {
  estimatedReal: number;
  total: number;
  percentage: number;
  platform: Platform;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function getPercentageColor(pct: number): string {
  if (pct >= 70) return 'text-green-400';
  if (pct >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getBarColor(pct: number): string {
  if (pct >= 70) return 'bg-green-400';
  if (pct >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

export default function RealReach({
  estimatedReal,
  total,
  percentage,
  platform,
}: RealReachProps) {
  const isYouTube = platform === 'youtube';

  const heading = getLabel(platform, 'realReachLabel');

  const totalLabel = isYouTube ? 'total subscribers' : 'total followers';

  const footerNote = isYouTube
    ? 'Based on engagement and comment quality analysis'
    : 'Based on combined fraud signal analysis';

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#8899aa]" />
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          {heading}
        </h3>
      </div>

      {/* Large number */}
      <p className="text-4xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
        {formatNumber(estimatedReal)}
      </p>

      {/* Subtext */}
      <p className="text-sm text-[#8899aa] mt-1">
        of {formatNumber(total)} {totalLabel}{' '}
        <span className={`font-semibold ${getPercentageColor(percentage)}`}>
          ({percentage}% authentic)
        </span>
      </p>

      {/* Progress bar */}
      <div className="mt-5 h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-[#8899aa]">0%</span>
        <span className={`text-xs font-semibold ${getPercentageColor(percentage)}`}>
          {percentage}%
        </span>
        <span className="text-xs text-[#8899aa]">100%</span>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-500 mt-4">{footerNote}</p>
    </div>
  );
}
