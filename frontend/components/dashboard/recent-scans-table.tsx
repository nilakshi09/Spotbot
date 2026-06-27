'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { PlatformBadge } from '@/components/ui/platform-badge';
import { formatFollowerCount } from '@/lib/platform-labels';
import { ScanListItem } from '@/types/scan';

interface RecentScansTableProps {
  scans: ScanListItem[];
}

function getFraudScoreColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

function getRiskBadge(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') {
  const styles: Record<string, string> = {
    LOW: 'bg-green-400/10 text-green-400 border border-green-400/20',
    MEDIUM: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
    HIGH: 'bg-red-400/10 text-red-400 border border-red-400/20',
    CRITICAL: 'bg-red-500/15 text-red-400 border border-red-400/30 shadow-[0_0_8px_rgba(255,71,87,0.3)]',
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {level}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function RecentScansTable({ scans }: RecentScansTableProps) {
  if (scans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d1117] border border-white/10 rounded-2xl p-12 text-center"
      >
        <p className="text-[#8899aa] text-sm">No scans yet</p>
        <p className="text-[#8899aa]/60 text-xs mt-1">
          Run your first scan to see results here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Handle
              </th>
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Platform
              </th>
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Followers
              </th>
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Fraud Score
              </th>
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Risk Level
              </th>
              <th className="text-left text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Date
              </th>
              <th className="text-right text-xs text-[#8899aa] uppercase tracking-wider font-medium px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, index) => (
              <motion.tr
                key={scan.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                {/* Handle */}
                <td className="px-6 py-4">
                  <span className="text-white text-sm font-medium">@{scan.handle}</span>
                </td>

                {/* Platform */}
                <td className="px-6 py-4">
                  <PlatformBadge platform={scan.platform} size="sm" />
                </td>

                {/* Followers */}
                <td className="px-6 py-4">
                  <span className="text-[#8899aa] text-sm">
                    {scan.followers != null
                      ? formatFollowerCount(scan.followers, scan.platform)
                      : '—'}
                  </span>
                </td>

                {/* Fraud Score */}
                <td className="px-6 py-4">
                  {scan.fraudScore != null ? (
                    <span className={`text-sm font-bold tabular-nums ${getFraudScoreColor(scan.fraudScore)}`}>
                      {scan.fraudScore}
                    </span>
                  ) : (
                    <span className="text-[#8899aa] text-sm">—</span>
                  )}
                </td>

                {/* Risk Level */}
                <td className="px-6 py-4">
                  {scan.riskLevel ? getRiskBadge(scan.riskLevel) : (
                    <span className="text-[#8899aa] text-sm">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <span className="text-[#8899aa] text-sm">
                    {formatDate(scan.createdAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-4">
                    {scan.shareStatus?.isShared && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Shared
                      </span>
                    )}
                    <Link
                      href={`/scan/${scan.id}`}
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                    >
                      View Report
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
