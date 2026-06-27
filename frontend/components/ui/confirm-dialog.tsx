'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'danger' | 'default'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 bg-[#111820] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <Dialog.Title className="text-lg font-semibold text-white mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-400 mb-6">
            {description}
          </Dialog.Description>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                variant === 'danger'
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-cyan-500 text-white hover:bg-cyan-400'
              }`}
            >
              {isLoading ? '...' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
