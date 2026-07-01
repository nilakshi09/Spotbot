export type BulkScanStatus =
  'pending' | 'processing' | 'completed' | 'failed'

export interface BulkHandle {
  handle: string
  platform: 'instagram' | 'youtube'
  scanId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fraudScore?: number
  riskLevel?: string
  error?: string
}

export interface BulkScan {
  id: string
  status: BulkScanStatus
  totalHandles: number
  completedCount: number
  failedCount: number
  progressPct: number
  handles?: BulkHandle[]
  resultUrl?: string
  createdAt: string
  completedAt?: string
}

export interface BulkScanProgress {
  status: BulkScanStatus
  completedCount: number
  failedCount: number
  progressPct: number
}

export interface CreateBulkScanResponse {
  id: string
  totalHandles: number
  skippedHandles: number
  status: BulkScanStatus
  message: string
  parseWarnings?: string[]
}
