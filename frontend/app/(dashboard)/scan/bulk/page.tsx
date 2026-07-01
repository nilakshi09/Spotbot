'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useBulkScans } from '@/hooks/use-bulk-scan'
import { CSVUploader } from '@/components/bulk-scan/csv-uploader'
import { BulkScanHistory } from '@/components/bulk-scan/bulk-scan-history'
import { BulkScanProgress } from '@/components/bulk-scan/bulk-scan-progress'
import { UpgradeWall } from '@/components/billing/upgrade-wall'
import { FileSpreadsheet } from 'lucide-react'

export default function BulkScanPage() {
  const { data: stats } = useDashboardStats()
  const { data: bulkScansData, isLoading } = useBulkScans()
  const [activeBulkScanId, setActiveBulkScanId] = useState<
    string | null
  >(null)

  // Check if plan supports bulk scanning
  const planName = stats?.planName ?? 'free'
  const isBulkAllowed = planName !== 'free'

  // Show upgrade wall for free plan
  if (!isBulkAllowed && stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="mt-8">
          <UpgradeWall
            used={stats.scansUsed}
            limit={stats.scanLimit}
            plan={planName}
            customMessage="Bulk scanning is available on Starter and Pro plans."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <PageHeader planName={planName} />

      {/* Active bulk scan progress */}
      {activeBulkScanId && (
        <BulkScanProgress
          bulkScanId={activeBulkScanId}
          onComplete={() => {
            // Keep showing progress but mark as done
          }}
        />
      )}

      {/* CSV Uploader */}
      {!activeBulkScanId && (
        <CSVUploader
          planName={planName}
          onScanCreated={(id) => setActiveBulkScanId(id)}
        />
      )}

      {/* Bulk Scan History */}
      <BulkScanHistory
        bulkScans={bulkScansData?.data ?? []}
        isLoading={isLoading}
        onViewProgress={(id) => setActiveBulkScanId(id)}
      />
    </div>
  )
}

function PageHeader({ planName }: { planName?: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileSpreadsheet size={24} className="text-indigo-400" />
          Bulk Scan
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload a CSV to scan multiple influencers at once
        </p>
      </div>

      {planName && planName !== 'free' && (
        <div className="text-right">
          <div className="text-xs text-gray-500">Plan limit</div>
          <div className="text-sm text-white font-medium">
            {planName === 'starter' ? '50' : planName === 'pro'
              ? '200' : '500'} handles per upload
          </div>
        </div>
      )}
    </div>
  )
}
