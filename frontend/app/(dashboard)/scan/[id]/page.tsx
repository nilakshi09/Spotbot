'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Share2, Zap } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { PlatformBadge } from '@/components/ui/platform-badge';
import ProfileSummary from '@/components/report/profile-summary';
import FollowerGrowthChart from '@/components/report/follower-growth-chart';
import EngagementBenchmarkChart from '@/components/report/engagement-benchmark-chart';
import RealReach from '@/components/report/real-reach';
import { ShareModal } from '@/components/report/share-modal';
import { useShareStatus } from '@/hooks/use-share-report';
import ScanProgress from '@/components/scan/scan-progress';
import type { ScanResult, Platform } from '@/types/scan';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/format';
import { CacheIndicator } from '@/components/report/cache-indicator';
import { useCreateScan } from '@/hooks/use-create-scan';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getRiskColor(level?: string): string {
  switch (level) {
    case 'LOW': return 'text-green-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'HIGH': return 'text-red-400';
    case 'CRITICAL': return 'text-red-500';
    default: return 'text-muted';
  }
}

function getRiskBg(level?: string): string {
  switch (level) {
    case 'LOW': return 'bg-green-400/10 border-green-400/20';
    case 'MEDIUM': return 'bg-yellow-400/10 border-yellow-400/20';
    case 'HIGH': return 'bg-red-400/10 border-red-400/20';
    case 'CRITICAL': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-white/5 border-white/10';
  }
}

export default function ScanResultPage() {
  const params = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchScan = async () => {
      try {
        const data = await apiClient.get<ScanResult>(`/api/scans/${params.id}`);
        if (mounted) {
          setScan(data);
          setIsLoading(false);

          // Stop polling once scan is completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load scan');
          setIsLoading(false);
        }
      }
    };

    fetchScan();
    // Poll every 3 seconds while scan is processing
    pollInterval = setInterval(fetchScan, 3000);

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [params.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto pt-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin inline-block mb-4" />
          <p className="text-muted">Loading scan results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scan) {
    return (
      <div className="max-w-5xl mx-auto pt-10">
        <motion.div {...fadeUp} className="bg-[#0d1117] border border-red-500/20 rounded-2xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Scan Not Found</h2>
          <p className="text-muted text-sm mb-6">{error || 'This scan could not be loaded.'}</p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Start a new scan
          </Link>
        </motion.div>
      </div>
    );
  }

  // Processing state — show progress
  if (scan.status === 'pending' || scan.status === 'processing') {
    return (
      <div className="max-w-3xl mx-auto pt-10">
        <ScanProgress
          scanId={scan.id}
          handle={scan.handle}
          platform={scan.platform}
          stepsCompleted={(scan as any).progress?.stepsCompleted}
        />
      </div>
    );
  }

  // Failed state
  if (scan.status === 'failed') {
    return (
      <div className="max-w-5xl mx-auto pt-10">
        <motion.div {...fadeUp} className="bg-[#0d1117] border border-red-500/20 rounded-2xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Scan Failed</h2>
          <p className="text-muted text-sm mb-6">
            We couldn&apos;t analyze @{scan.handle}. The account may be private or unavailable.
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Try another scan
          </Link>
        </motion.div>
      </div>
    );
  }

  // Completed state — show full report
  const platform = scan.platform || 'instagram';
  const platformLabel = platform === 'youtube' ? 'YouTube' : 'Instagram';

  return (
    <ScanReportContent
      scan={scan}
      platform={platform}
      platformLabel={platformLabel}
    />
  );
}

// Extracted to a separate component so hooks (useShareStatus) can be called unconditionally
function ScanReportContent({
  scan,
  platform,
  platformLabel,
}: {
  scan: ScanResult;
  platform: 'instagram' | 'youtube';
  platformLabel: string;
}) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { data: shareStatus } = useShareStatus(scan.id);
  const isShared = shareStatus?.isShared ?? false;

  const router = useRouter();
  const createScan = useCreateScan();
  const [isRescanning, setIsRescanning] = useState(false);

  async function handleRescan() {
    setIsRescanning(true);
    try {
      const result = await createScan.mutateAsync({
        platform: scan.platform as Platform,
        handle: scan.handle,
      });
      router.push(`/scan?resumeId=${result.id}`);
    } catch {
      setIsRescanning(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-12">
      {/* Cached Banner */}
      {scan.cached && (
        <div className="bg-indigo-500/5 border border-indigo-500/20
          rounded-xl px-4 py-2.5 flex items-center justify-between
          text-sm mb-6">
          <div className="flex items-center gap-2 text-indigo-300">
            <Zap size={14} fill="currentColor" />
            Cached result — data from {timeAgo(scan.createdAt)}
          </div>
          <span className="text-gray-500 text-xs">
            {scan.expiresAt
              ? `Refreshes ${timeAgo(scan.expiresAt)}`
              : ''}
          </span>
        </div>
      )}

      {/* Header */}
      <motion.div {...fadeUp} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
                @{scan.handle}
              </h1>
              <PlatformBadge platform={platform} size="sm" />
            </div>
            <p className="text-muted text-sm mt-1">
              {platformLabel} Fraud Report
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Share status indicator */}
          {isShared && (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Shared
            </div>
          )}

          {/* Share button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              isShared
                ? 'border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-white/10 bg-white/5 text-muted hover:text-white hover:bg-white/10'
            }`}
          >
            <Share2 className="w-4 h-4" />
            {isShared ? 'Shared' : 'Share'}
          </button>

          {/* Fraud Score Badge */}
          {scan.fraudScore !== undefined && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${getRiskBg(scan.riskLevel)}`}>
              <div className="text-right">
                <p className="text-xs text-muted">Fraud Score</p>
                <p className={`text-2xl font-bold ${getRiskColor(scan.riskLevel)}`}>
                  {scan.fraudScore}
                </p>
              </div>
              <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${getRiskColor(scan.riskLevel)}`}>
                {scan.riskLevel}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Summary */}
      {scan.profile && (
        <motion.div {...fadeUp} transition={{ delay: 0.1, ...fadeUp.transition }}>
          <ProfileSummary
            profile={scan.profile}
            platform={platform}
            handle={scan.handle}
            riskLevel={scan.riskLevel}
          />
        </motion.div>
      )}

      {/* Signal Cards */}
      {scan.signals && scan.signals.length > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.2, ...fadeUp.transition }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
        >
          {scan.signals.map((signal, i) => (
            <div
              key={i}
              className={`bg-[#0d1117] border rounded-xl p-4 ${
                signal.risk === 'high'
                  ? 'border-red-500/20'
                  : signal.risk === 'medium'
                  ? 'border-yellow-500/20'
                  : 'border-green-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{signal.label}</span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    signal.risk === 'high'
                      ? 'bg-red-400/10 text-red-400'
                      : signal.risk === 'medium'
                      ? 'bg-yellow-400/10 text-yellow-400'
                      : 'bg-green-400/10 text-green-400'
                  }`}
                >
                  {signal.risk}
                </span>
              </div>
              <p className="text-sm text-muted">{signal.value}</p>
              {signal.description && (
                <p className="text-xs text-muted/70 mt-1">{signal.description}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Engagement Benchmark */}
        {scan.engagementDetails && (
          <motion.div {...fadeUp} transition={{ delay: 0.3, ...fadeUp.transition }}>
            <EngagementBenchmarkChart
              details={scan.engagementDetails}
              platform={platform}
            />
          </motion.div>
        )}

        {/* Follower Growth */}
        <motion.div {...fadeUp} transition={{ delay: 0.35, ...fadeUp.transition }}>
          <FollowerGrowthChart
            data={scan.followerHistory || []}
            platform={platform}
          />
        </motion.div>
      </div>

      {/* Real Reach */}
      {scan.realReach && (
        <motion.div {...fadeUp} transition={{ delay: 0.4, ...fadeUp.transition }} className="mt-6">
          <RealReach
            estimatedReal={scan.realReach.estimatedReal}
            total={scan.realReach.total}
            percentage={scan.realReach.percentage}
            platform={platform}
          />
        </motion.div>
      )}

      {/* Share Modal */}
      <ShareModal
        scanId={scan.id}
        handle={scan.handle}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
      />

      {/* Cache Indicator */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <CacheIndicator
          cached={scan.cached ?? false}
          createdAt={scan.createdAt}
          expiresAt={scan.expiresAt ?? null}
          scanId={scan.id}
          onRescan={handleRescan}
          isRescanning={isRescanning}
        />
      </div>
    </div>
  );
}
