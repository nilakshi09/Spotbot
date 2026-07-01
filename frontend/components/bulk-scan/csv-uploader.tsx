'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileText,
  AlertCircle,
  Download,
  CheckCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateBulkScan } from '@/hooks/use-bulk-scan'
import { useToast } from '@/hooks/use-toast'

interface CSVUploaderProps {
  planName: string
  onScanCreated: (bulkScanId: string) => void
}

export function CSVUploader({
  planName,
  onScanCreated,
}: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const createBulkScan = useCreateBulkScan()
  const { toast } = useToast()

  const maxHandles = planName === 'starter' ? 50
    : planName === 'pro' ? 200 : 500

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    if (!csvFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file (.csv)')
      return
    }

    if (csvFile.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.')
      return
    }

    setFile(csvFile)
    setParseWarnings([])
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 1024 * 1024,
  })

  async function handleUpload() {
    if (!file) return

    try {
      const result = await createBulkScan.mutateAsync(file)

      if (result.parseWarnings && result.parseWarnings.length > 0) {
        setParseWarnings(result.parseWarnings)
      }

      toast.success(
        `Bulk scan started! Processing ${result.totalHandles} handles.`
      )
      onScanCreated(result.id)
    } catch (err) {
      const e = err as Error
      toast.error(e.message ?? 'Failed to start bulk scan')
    }
  }

  function handleRemoveFile() {
    setFile(null)
    setParseWarnings([])
  }

  async function handleDownloadTemplate() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    window.open(`${apiUrl}/api/scans/bulk/template`, '_blank')
  }

  return (
    <div className="space-y-4">

      {/* Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">
            Upload CSV
          </h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-sm
              text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Download size={14} />
            Download template
          </button>
        </div>

        {/* Drop zone */}
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10
              text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/5'
                : 'border-white/10 hover:border-white/20 hover:bg-white/3'
            }`}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center
                justify-center ${isDragActive
                  ? 'bg-indigo-500/20'
                  : 'bg-white/5'}`}>
                <Upload size={20} className={isDragActive
                  ? 'text-indigo-400'
                  : 'text-gray-400'} />
              </div>

              <div>
                <p className="text-white text-sm font-medium">
                  {isDragActive
                    ? 'Drop your CSV here'
                    : 'Drag and drop your CSV file'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  or click to browse · Max {maxHandles} handles · 1MB limit
                </p>
              </div>
            </div>
          </div>
        ) : (
          // File selected state
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-white/10 rounded-xl p-4
                flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-indigo-500/10 border
                border-indigo-500/20 rounded-lg flex items-center
                justify-center shrink-0">
                <FileText size={18} className="text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>

              <button
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-white
                  transition-colors text-xs"
              >
                Remove
              </button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Parse warnings */}
        {parseWarnings.length > 0 && (
          <div className="mt-3 bg-amber-400/5 border border-amber-400/20
            rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400
              text-sm font-medium mb-2">
              <AlertCircle size={14} />
              Parse Warnings ({parseWarnings.length})
            </div>
            <ul className="space-y-1">
              {parseWarnings.slice(0, 5).map((warning, i) => (
                <li key={i} className="text-xs text-amber-300/70">
                  · {warning}
                </li>
              ))}
              {parseWarnings.length > 5 && (
                <li className="text-xs text-gray-500">
                  +{parseWarnings.length - 5} more warnings
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Upload button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={createBulkScan.isPending}
            className="w-full mt-4 py-3 bg-indigo-600
              hover:bg-indigo-500 disabled:opacity-50
              text-white font-semibold rounded-xl
              transition-colors flex items-center
              justify-center gap-2"
          >
            {createBulkScan.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30
                  border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Start Bulk Scan
              </>
            )}
          </button>
        )}
      </div>

      {/* CSV Format Guide */}
      <CSVFormatGuide />
    </div>
  )
}

// ─── CSV FORMAT GUIDE ─────────────────────────────────────────────────────────

function CSVFormatGuide() {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
      <h3 className="text-sm font-medium text-white mb-3">
        CSV Format
      </h3>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1.5">
            Required columns:
          </div>
          <div className="font-mono text-xs bg-black/30
            rounded-lg px-3 py-2 text-green-400">
            handle,platform
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1.5">
            Example rows:
          </div>
          <div className="font-mono text-xs bg-black/30
            rounded-lg px-3 py-2 space-y-1">
            <div className="text-gray-400">handle,platform</div>
            <div className="text-white">cristiano,instagram</div>
            <div className="text-white">natgeo,instagram</div>
            <div className="text-white">mkbhd,youtube</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-green-400" />
            @ prefix optional
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-green-400" />
            Duplicates auto-removed
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-green-400" />
            Platform defaults to instagram
          </div>
        </div>
      </div>
    </div>
  )
}
