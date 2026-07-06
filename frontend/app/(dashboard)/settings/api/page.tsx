'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
} from '@/hooks/use-api-keys'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UpgradeWall } from '@/components/billing/upgrade-wall'
import { copyToClipboard } from '@/lib/clipboard'
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { timeAgo, formatDate } from '@/lib/format'
import type { ApiKeyItem, CreateApiKeyResponse } from '@/types/api-key'

export default function ApiKeysPage() {
  const { data: stats } = useDashboardStats()
  const { data: keysData, isLoading } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
  const rotateApiKey = useRotateApiKey()
  const { toast } = useToast()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState<CreateApiKeyResponse | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyItem | null>(null)
  const [confirmRotate, setConfirmRotate] = useState<ApiKeyItem | null>(null)

  const isPlanAllowed = ['pro', 'enterprise'].includes(
    stats?.planName ?? ''
  )

  if (!isPlanAllowed && stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="mt-8">
          <UpgradeWall
            used={stats.scansUsed}
            limit={stats.scanLimit}
            plan={stats.planName}
            customMessage="API access is available on Pro and Enterprise plans."
          />
        </div>
      </div>
    )
  }

  async function handleCreate(name: string, expiresInDays?: number) {
    try {
      const result = await createApiKey.mutateAsync({
        name,
        expiresInDays,
      })
      setNewKeyData(result)
      setShowCreateModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? (err.message ?? 'Failed to create API key') : 'Failed to create API key')
    }
  }

  async function handleRevoke() {
    if (!confirmRevoke) return
    try {
      await revokeApiKey.mutateAsync(confirmRevoke.id)
      toast.success(`API key "${confirmRevoke.name}" revoked`)
      setConfirmRevoke(null)
    } catch {
      toast.error('Failed to revoke API key')
    }
  }

  async function handleRotate() {
    if (!confirmRotate) return
    try {
      const result = await rotateApiKey.mutateAsync(confirmRotate.id)
      setNewKeyData(result)
      setConfirmRotate(null)
      toast.success('API key rotated')
    } catch {
      toast.error('Failed to rotate API key')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5
            bg-indigo-600 hover:bg-indigo-500 text-white
            text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} />
          Create API Key
        </button>
      </div>

      {/* New key display (shown after creation/rotation) */}
      {newKeyData && (
        <NewKeyDisplay
          keyData={newKeyData}
          onDismiss={() => setNewKeyData(null)}
        />
      )}

      {/* API Keys Table */}
      <ApiKeysTable
        keys={keysData?.data ?? []}
        isLoading={isLoading}
        onRevoke={setConfirmRevoke}
        onRotate={setConfirmRotate}
      />

      {/* Quick start guide */}
      <QuickStartGuide />

      {/* Create modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isCreating={createApiKey.isPending}
        />
      )}

      {/* Revoke confirm */}
      <ConfirmDialog
        open={!!confirmRevoke}
        onOpenChange={(o) => !o && setConfirmRevoke(null)}
        title={`Revoke "${confirmRevoke?.name}"?`}
        description="Any applications using this key will immediately lose access. This cannot be undone."
        confirmLabel="Revoke Key"
        variant="danger"
        onConfirm={handleRevoke}
        isLoading={revokeApiKey.isPending}
      />

      {/* Rotate confirm */}
      <ConfirmDialog
        open={!!confirmRotate}
        onOpenChange={(o) => !o && setConfirmRotate(null)}
        title={`Rotate "${confirmRotate?.name}"?`}
        description="The old key will be revoked immediately. A new key will be generated. Update all applications before dismissing the new key."
        confirmLabel="Rotate Key"
        variant="default"
        onConfirm={handleRotate}
        isLoading={rotateApiKey.isPending}
      />
    </div>
  )
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center
        gap-3">
        <Key size={22} className="text-indigo-400" />
        API Keys
      </h1>
      <p className="text-gray-400 text-sm mt-1">
        Programmatically access Spotbot from your applications
      </p>
    </div>
  )
}

// ─── NEW KEY DISPLAY ──────────────────────────────────────────────────────────

function NewKeyDisplay({
  keyData,
  onDismiss,
}: {
  keyData: CreateApiKeyResponse
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  async function handleCopy() {
    const success = await copyToClipboard(keyData.key)
    if (success) {
      setCopied(true)
      toast.success('API key copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-amber-400/5 border border-amber-400/30
      rounded-2xl p-6">

      {/* Warning header */}
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle size={20} className="text-amber-400 shrink-0" />
        <div>
          <div className="text-amber-400 font-semibold text-sm">
            Save your API key now
          </div>
          <div className="text-amber-300/70 text-xs mt-0.5">
            This key will not be shown again after you dismiss this message.
          </div>
        </div>
      </div>

      {/* Key display */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-black/30 border border-white/10
          rounded-xl px-4 py-3 font-mono text-sm text-white
          overflow-x-auto whitespace-nowrap">
          {keyData.key}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-3
            bg-amber-500 hover:bg-amber-400 text-black
            font-medium text-sm rounded-xl transition-colors
            shrink-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Key info */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Key: <span className="text-white">{keyData.name}</span>
          {keyData.expiresAt && (
            <> · Expires {formatDate(keyData.expiresAt)}</>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-sm text-gray-400 hover:text-white
            transition-colors"
        >
          I&apos;ve saved it — dismiss
        </button>
      </div>
    </div>
  )
}

// ─── API KEYS TABLE ───────────────────────────────────────────────────────────

function ApiKeysTable({
  keys,
  isLoading,
  onRevoke,
  onRotate,
}: {
  keys: ApiKeyItem[]
  isLoading: boolean
  onRevoke: (key: ApiKeyItem) => void
  onRotate: (key: ApiKeyItem) => void
}) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg
              animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (keys.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl
        p-8 text-center">
        <Key size={24} className="text-gray-600 mx-auto mb-3" />
        <div className="text-gray-400 text-sm">No API keys yet</div>
        <div className="text-gray-600 text-xs mt-1">
          Create your first API key to get started
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl
      overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">
          Active Keys
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {keys.map(key => (
          <div key={key.id} className="px-6 py-4 flex items-center
            gap-4">

            {/* Key icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center
              justify-center shrink-0 ${
              key.isActive
                ? 'bg-indigo-500/10 border border-indigo-500/20'
                : 'bg-white/5 border border-white/10'
            }`}>
              <Key size={16} className={
                key.isActive ? 'text-indigo-400' : 'text-gray-600'
              } />
            </div>

            {/* Key info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {key.name}
                </span>
                {!key.isActive && (
                  <span className="text-xs text-red-400
                    bg-red-400/10 px-1.5 py-0.5 rounded-full">
                    Revoked
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                {key.keyPrefix}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Created {timeAgo(key.createdAt)}
                {key.lastUsedAt && (
                  <> · Last used {timeAgo(key.lastUsedAt)}</>
                )}
                {key.requestCount > 0 && (
                  <> · {key.requestCount.toLocaleString()} requests</>
                )}
                {key.expiresAt && (
                  <> · Expires {formatDate(key.expiresAt)}</>
                )}
              </div>
            </div>

            {/* Actions */}
            {key.isActive && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRotate(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5
                    border border-white/10 hover:border-white/20
                    text-gray-400 hover:text-white text-xs
                    rounded-lg transition-colors"
                >
                  <RefreshCw size={12} />
                  Rotate
                </button>
                <button
                  onClick={() => onRevoke(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5
                    border border-red-400/20 hover:border-red-400/40
                    text-red-400 hover:text-red-300 text-xs
                    rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                  Revoke
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CREATE API KEY MODAL ─────────────────────────────────────────────────────

function CreateApiKeyModal({
  onClose,
  onCreate,
  isCreating,
}: {
  onClose: () => void
  onCreate: (name: string, expiresInDays?: number) => void
  isCreating: boolean
}) {
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState<string>('never')

  const expiryOptions = [
    { value: 'never', label: 'Never expires' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '180 days' },
    { value: '365', label: '1 year' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm
      z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border
        border-white/10 rounded-2xl p-6">

        <h2 className="text-lg font-semibold text-white mb-1">
          Create API Key
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Give your key a descriptive name so you can identify it later
        </p>

        <div className="space-y-4">
          {/* Name input */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Key Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production App, CI Pipeline"
              maxLength={100}
              autoFocus
              className="w-full px-4 py-2.5 bg-white/5 border
                border-white/10 rounded-xl text-white text-sm
                placeholder:text-gray-600 outline-none
                focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Expiry selector */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Expiry
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border
                border-white/10 rounded-xl text-white text-sm
                outline-none focus:border-indigo-500"
            >
              {expiryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10
                text-gray-400 hover:text-white rounded-xl
                text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(
                name,
                expiry === 'never' ? undefined : parseInt(expiry),
              )}
              disabled={!name.trim() || isCreating}
              className="flex-1 py-2.5 bg-indigo-600
                hover:bg-indigo-500 disabled:opacity-50
                text-white font-medium rounded-xl text-sm
                transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── QUICK START GUIDE ────────────────────────────────────────────────────────

function QuickStartGuide() {
  const [copied, setCopied] = useState<string | null>(null)


  async function copy(text: string, id: string) {
    await copyToClipboard(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const examples = [
    {
      id: 'scan',
      label: 'Create a scan',
      code: `curl -X POST https://api.spotbot.io/api/scans \\
  -H "X-API-Key: sb_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"instagram","handle":"cristiano"}'`,
    },
    {
      id: 'get',
      label: 'Get scan result',
      code: `curl https://api.spotbot.io/api/scans/{scan_id} \\
  -H "X-API-Key: sb_live_your_key_here"`,
    },
  ]

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          Quick Start
        </h2>
        
        <a
          href="/api/docs/ui"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm
            text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ExternalLink size={14} />
          Full API Docs
        </a>
      </div>

      <div className="space-y-4">
        {examples.map(example => (
          <div key={example.id}>
            <div className="text-xs text-gray-500 mb-2">
              {example.label}
            </div>
            <div className="relative">
              <pre className="bg-black/40 rounded-xl px-4 py-3
                text-xs text-green-400 overflow-x-auto font-mono
                whitespace-pre">
                {example.code}
              </pre>
              <button
                onClick={() => copy(example.code, example.id)}
                className="absolute top-2 right-2 p-1.5
                  bg-white/10 hover:bg-white/20 rounded-lg
                  text-gray-400 hover:text-white transition-colors"
              >
                {copied === example.id
                  ? <Check size={12} />
                  : <Copy size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
