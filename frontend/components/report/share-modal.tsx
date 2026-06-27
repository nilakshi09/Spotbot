'use client'

import { useState } from 'react'
import { Copy, Check, Link, Trash2, Eye, Clock } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { useGenerateShareLink, useRevokeShareLink, useShareStatus } from '@/hooks/use-share-report'
import { useToast } from '@/hooks/use-toast'
import { copyToClipboard } from '@/lib/clipboard'
import { timeAgo } from '@/lib/format'

interface ShareModalProps {
  scanId: string
  handle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareModal({
  scanId,
  handle,
  open,
  onOpenChange,
}: ShareModalProps) {
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const { data: shareStatus, isLoading: statusLoading } = useShareStatus(scanId)
  const generateLink = useGenerateShareLink(scanId)
  const revokeLink = useRevokeShareLink(scanId)

  // Copy share URL to clipboard
  async function handleCopy(url: string) {
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy — please copy the link manually')
    }
  }

  // Generate new share link
  async function handleGenerate() {
    try {
      await generateLink.mutateAsync(expiresInDays)
      toast.success('Share link generated!')
    } catch {
      toast.error('Failed to generate share link')
    }
  }

  // Revoke existing share link
  async function handleRevoke() {
    try {
      await revokeLink.mutateAsync()
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke link')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

        {/* Modal */}
        <Dialog.Content className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-md z-50
          bg-gray-900 border border-white/10 rounded-2xl
          p-6 shadow-2xl
        ">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Share Report
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-400 mt-0.5">
                Share @{handle}&apos;s fraud analysis report
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
              ✕
            </Dialog.Close>
          </div>

          {/* Content */}
          {statusLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : shareStatus?.isShared && shareStatus.shareUrl ? (
            // Active share link exists
            <ActiveShareView
              shareUrl={shareStatus.shareUrl}
              expiresAt={shareStatus.expiresAt}
              viewCount={shareStatus.viewCount}
              copied={copied}
              onCopy={() => handleCopy(shareStatus.shareUrl!)}
              onRevoke={handleRevoke}
              isRevoking={revokeLink.isPending}
            />
          ) : (
            // No active share link — show generate form
            <GenerateShareView
              expiresInDays={expiresInDays}
              onExpiresChange={setExpiresInDays}
              onGenerate={handleGenerate}
              isGenerating={generateLink.isPending}
              generatedUrl={generateLink.data?.shareUrl}
              copied={copied}
              onCopy={() => handleCopy(generateLink.data?.shareUrl ?? '')}
            />
          )}

          {/* Privacy note */}
          <p className="text-xs text-gray-600 mt-4 text-center">
            Anyone with the link can view this report — no login required
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── ACTIVE SHARE VIEW ───────────────────────────────────────────────────────

function ActiveShareView({
  shareUrl,
  expiresAt,
  viewCount,
  copied,
  onCopy,
  onRevoke,
  isRevoking,
}: {
  shareUrl: string
  expiresAt: string | null
  viewCount: number
  copied: boolean
  onCopy: () => void
  onRevoke: () => void
  isRevoking: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Active badge */}
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Share link is active
      </div>

      {/* Share URL input with copy button */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-lg
          px-3 py-2.5 text-sm text-gray-300 truncate font-[family-name:var(--font-jetbrains-mono)]">
          {shareUrl}
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-3 py-2.5
            bg-indigo-600 hover:bg-indigo-500 text-white text-sm
            rounded-lg transition-colors shrink-0"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {viewCount} {viewCount === 1 ? 'view' : 'views'}
        </span>
        {expiresAt && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Expires {timeAgo(expiresAt)}
          </span>
        )}
      </div>

      {/* Revoke button */}
      <button
        onClick={onRevoke}
        disabled={isRevoking}
        className="flex items-center gap-2 text-sm text-red-400
          hover:text-red-300 transition-colors disabled:opacity-50"
      >
        <Trash2 size={14} />
        {isRevoking ? 'Revoking...' : 'Revoke link'}
      </button>
    </div>
  )
}

// ─── GENERATE SHARE VIEW ─────────────────────────────────────────────────────

function GenerateShareView({
  expiresInDays,
  onExpiresChange,
  onGenerate,
  isGenerating,
  generatedUrl,
  copied,
  onCopy,
}: {
  expiresInDays: number
  onExpiresChange: (days: number) => void
  onGenerate: () => void
  isGenerating: boolean
  generatedUrl?: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Expiry selector */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">
          Link expires after
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => onExpiresChange(days)}
              className={`py-2 px-3 rounded-lg text-sm font-medium
                border transition-colors ${
                expiresInDays === days
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Generated URL (shown after generation) */}
      <AnimatePresence>
        {generatedUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div className="flex-1 bg-white/5 border border-white/10
              rounded-lg px-3 py-2.5 text-sm text-gray-300
              truncate font-[family-name:var(--font-jetbrains-mono)]">
              {generatedUrl}
            </div>
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2.5
                bg-indigo-600 hover:bg-indigo-500 text-white text-sm
                rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500
          disabled:opacity-50 text-white font-medium rounded-lg
          transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30
              border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Link size={16} />
            {generatedUrl ? 'Generate New Link' : 'Generate Share Link'}
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400 font-medium">What gets shared: </span>
          The full fraud analysis report including score, signal breakdown,
          and charts. Viewers cannot re-scan or download the PDF.
        </p>
      </div>
    </div>
  )
}
