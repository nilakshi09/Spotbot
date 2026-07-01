'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { useUploadLogo } from '@/hooks/use-white-label'
import { useToast } from '@/hooks/use-toast'

interface LogoUploaderProps {
  currentLogoUrl: string | null
  companyName: string
}

export function LogoUploader({
  currentLogoUrl,
  companyName,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadLogo = useUploadLogo()
  const { toast } = useToast()

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      'image/png', 'image/jpeg',
      'image/svg+xml', 'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PNG, JPEG, SVG, or WebP')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB')
      return
    }

    try {
      await uploadLogo.mutateAsync(file)
      toast.success('Logo uploaded successfully')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to upload logo')
    }

    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Current logo preview */}
      {currentLogoUrl ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 bg-white/5 border border-white/10
            rounded-lg flex items-center justify-center p-2">
            <img
              src={currentLogoUrl}
              alt={companyName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="text-xs text-gray-400">
            Current logo
          </div>
        </div>
      ) : (
        <div className="w-24 h-16 bg-white/5 border border-white/10
          rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-600">No logo</span>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploadLogo.isPending}
          className="flex items-center gap-2 px-4 py-2
            border border-white/10 hover:border-white/20
            text-gray-300 hover:text-white text-sm
            rounded-xl transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
          {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
        </button>
        <span className="text-xs text-gray-600">
          PNG, JPEG, SVG or WebP · Max 2MB
        </span>
      </div>

      {/* Recommended size */}
      <p className="text-xs text-gray-600">
        Recommended: 200×60px, transparent background
      </p>
    </div>
  )
}
