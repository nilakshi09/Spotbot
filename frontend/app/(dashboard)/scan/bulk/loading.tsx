import { Skeleton } from '@/components/ui/skeleton'

export default function BulkScanLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Uploader skeleton */}
      <div className="bg-white/5 border border-white/10
        rounded-2xl p-6">
        <Skeleton className="h-5 w-32 mb-5" />
        <div className="border-2 border-dashed border-white/10
          rounded-xl p-10">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* History skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="px-6 py-4 border-b border-white/10">
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-white/5
            flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
