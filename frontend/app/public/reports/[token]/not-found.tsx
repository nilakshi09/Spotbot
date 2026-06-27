import Link from 'next/link'

export default function PublicReportNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col
      items-center justify-center px-4 text-center">

      {/* Spotbot Logo */}
      <div className="text-2xl font-bold text-indigo-400 mb-8
        font-[family-name:var(--font-space-grotesk)]">
        SPOTBOT
      </div>

      {/* Icon */}
      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center
        justify-center text-3xl mb-6">
        🔗
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-white mb-3">
        Report Not Found
      </h1>
      <p className="text-gray-400 max-w-sm mb-2">
        This report link is invalid or has expired.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        The link may have been revoked by its owner or
        the expiry period has passed.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500
            text-white font-medium rounded-xl transition-colors"
        >
          Go to Spotbot →
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 border border-white/10
            hover:border-white/20 text-gray-300 hover:text-white
            font-medium rounded-xl transition-colors"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  )
}
