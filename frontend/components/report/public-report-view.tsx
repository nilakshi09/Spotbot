'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { PlatformBadge } from '@/components/ui/platform-badge'
import ProfileSummary from '@/components/report/profile-summary'
import FollowerGrowthChart from '@/components/report/follower-growth-chart'
import EngagementBenchmarkChart from '@/components/report/engagement-benchmark-chart'
import RealReach from '@/components/report/real-reach'
import { ErrorBoundary } from '@/components/error-boundary'
import { timeAgo } from '@/lib/format'
import type { ScanResult, Platform } from '@/types/scan'
import { type BrandingConfig, DEFAULT_BRANDING } from '@/types/white-label'

interface PublicReportViewProps {
  scan: ScanResult & { 
    shareInfo?: { expiresAt: string; viewCount: number };
    branding?: BrandingConfig;
  }
  token: string
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
    case 'LOW': return 'border-green-400 bg-green-400/5';
    case 'MEDIUM': return 'border-amber-400 bg-amber-400/5';
    case 'HIGH': return 'border-red-400 bg-red-400/5';
    case 'CRITICAL': return 'border-red-500 bg-red-500/5';
    default: return 'border-white/10 bg-white/5';
  }
}

function getRiskDescription(level?: string): string {
  switch (level) {
    case 'HIGH':
    case 'CRITICAL':
      return 'Strong signs of audience manipulation detected';
    case 'MEDIUM':
      return 'Some suspicious signals detected — review recommended';
    case 'LOW':
      return 'Audience appears authentic and organic';
    default:
      return '';
  }
}

export function PublicReportView({ scan }: PublicReportViewProps) {
  const platform: Platform = scan.platform || 'instagram';
  const platformLabel = platform === 'youtube' ? 'YouTube' : 'Instagram';
  const branding = scan.branding ?? DEFAULT_BRANDING;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* PUBLIC HEADER — different from dashboard */}
      <header className="border-b border-white/10 bg-gray-950/80
        backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center
          justify-between">

          {/* Left: Company branding */}
          <div className="flex items-center gap-3">
            {branding.logoUrl && !branding.hideSpotbotLogo ? (
              <Image
                src={branding.logoUrl}
                alt={branding.companyName}
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            ) : (
              !branding.hideSpotbotLogo && (
                <span
                  className="text-lg font-bold"
                  style={{ color: branding.primaryColor }}
                >
                  {branding.companyName}
                </span>
              )
            )}
            <span className="text-gray-600 text-sm hidden sm:block">
              {branding.reportHeaderText}
            </span>
          </div>

          {/* Right: CTA */}
          <Link
            href="/signup"
            className="flex items-center gap-2 px-4 py-2
              bg-indigo-600 hover:bg-indigo-500 text-white text-sm
              font-medium rounded-lg transition-colors"
          >
            Run your own scan
            <ExternalLink size={14} />
          </Link>
        </div>
      </header>

      {/* REPORT CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Shared report banner */}
        <div className="bg-indigo-500/5 border border-indigo-500/20
          rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-indigo-300">
            📊 Shared fraud analysis report
            {scan.shareInfo?.viewCount
              ? ` · ${scan.shareInfo.viewCount} views`
              : ''}
          </div>
          {scan.shareInfo?.expiresAt && (
            <div className="text-xs text-gray-500">
              Expires {timeAgo(scan.shareInfo.expiresAt)}
            </div>
          )}
        </div>

        {/* Report Header — handle + score */}
        <div className="flex items-center justify-between">
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

          {/* Fraud Score Badge */}
          {scan.fraudScore !== undefined && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
              scan.riskLevel === 'LOW' ? 'bg-green-400/10 border-green-400/20' :
              scan.riskLevel === 'MEDIUM' ? 'bg-yellow-400/10 border-yellow-400/20' :
              scan.riskLevel === 'HIGH' ? 'bg-red-400/10 border-red-400/20' :
              scan.riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
              'bg-white/5 border-white/10'
            }`}>
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

        {/* Profile Summary */}
        {scan.profile && (
          <ProfileSummary
            profile={scan.profile}
            handle={scan.handle}
            platform={platform}
            riskLevel={scan.riskLevel}
          />
        )}

        {/* Risk Summary */}
        {scan.riskLevel && (
          <div className={`border-l-4 rounded-r-xl p-5 ${getRiskBg(scan.riskLevel)}`}>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              &ldquo;{getRiskDescription(scan.riskLevel)}&rdquo;
            </p>
          </div>
        )}

        {/* Signal Cards */}
        {scan.signals && scan.signals.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Signal Breakdown
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              Independent signals analyzed to compute the fraud score
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>
        )}

        {/* Charts */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-5">
            Audience Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Benchmark */}
            {scan.engagementDetails && (
              <ErrorBoundary>
                <EngagementBenchmarkChart
                  details={scan.engagementDetails}
                  platform={platform}
                />
              </ErrorBoundary>
            )}

            {/* Follower Growth */}
            <ErrorBoundary>
              <FollowerGrowthChart
                data={scan.followerHistory || []}
                platform={platform}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Real Reach */}
        {scan.realReach && (
          <RealReach
            estimatedReal={scan.realReach.estimatedReal}
            total={scan.realReach.total}
            percentage={scan.realReach.percentage}
            platform={platform}
          />
        )}
      </main>

      {/* PUBLIC FOOTER — Spotbot CTA */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">

          {/* CTA Section */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="text-2xl font-bold text-white mb-3
              font-[family-name:var(--font-space-grotesk)]">
              Want to verify your influencers?
            </div>
            <p className="text-gray-400 mb-6">
              Spotbot gives agencies instant fraud scores for any
              Instagram or YouTube account. No sales call. No onboarding.
            </p>
            <div className="flex flex-col sm:flex-row gap-3
              justify-center">
              <Link
                href="/signup"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500
                  text-white font-semibold rounded-xl transition-colors"
              >
                Get Started Free →
              </Link>
              <Link
                href="/"
                className="px-6 py-3 border border-white/10
                  hover:border-white/20 text-gray-300 hover:text-white
                  rounded-xl transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>{branding.reportFooterText}</p>
            {!branding.hidePoweredBySpotbot && (
              <p>
                Powered by{' '}
                <a href="https://spotbot.io" className="text-gray-500 hover:text-gray-400">
                  Spotbot
                </a>
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
