export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-md ${className}`} />
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
