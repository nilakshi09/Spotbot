import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ScanResult } from '@/types/scan'
import { PublicReportView } from '@/components/report/public-report-view'

interface Props {
  params: Promise<{ token: string }>
}

// Server component — fetch data at request time
export default async function PublicReportPage({ params }: Props) {
  const { token } = await params;

  // Validate token format (64 hex chars)
  if (!/^[a-f0-9]{64}$/.test(token)) {
    notFound()
  }

  let scan: ScanResult & { shareInfo?: { expiresAt: string; viewCount: number } }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(
      `${apiUrl}/api/public/reports/${token}`,
      {
        cache: 'no-store',    // always fresh — view count changes
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!res.ok) {
      notFound()
    }

    scan = await res.json()
  } catch {
    notFound()
  }

  return <PublicReportView scan={scan} token={token} />
}

// Dynamic OG metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(
      `${apiUrl}/api/public/reports/${token}`,
      { cache: 'no-store' },
    )

    if (!res.ok) {
      return { title: 'Report Not Found — Spotbot' }
    }

    const scan = await res.json()
    const riskEmoji =
      scan.riskLevel === 'HIGH' || scan.riskLevel === 'CRITICAL' ? '🚨'
      : scan.riskLevel === 'MEDIUM' ? '⚠️'
      : '✅'

    const platformLabel = scan.platform === 'youtube' ? 'YouTube' : 'Instagram';

    return {
      title: `@${scan.handle} Fraud Report — Spotbot`,
      description:
        `${riskEmoji} Fraud Score: ${scan.fraudScore}/100 · ` +
        `Risk: ${scan.riskLevel} · ` +
        `${platformLabel} audience analysis`,
      openGraph: {
        title: `@${scan.handle} — Spotbot Fraud Analysis`,
        description: `Fraud Score: ${scan.fraudScore}/100 · ${platformLabel} audience analysis`,
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: `@${scan.handle} Fraud Report`,
        description: `Fraud Score: ${scan.fraudScore}/100`,
      },
    }
  } catch {
    return { title: 'Spotbot Fraud Report' }
  }
}
