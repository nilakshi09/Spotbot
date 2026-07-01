'use client'

import type { BrandingConfig } from '@/types/white-label'

interface BrandingPreviewProps {
  branding: BrandingConfig
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl
      overflow-hidden text-xs">

      {/* Preview label */}
      <div className="px-4 py-2 bg-white/3 border-b border-white/10
        text-gray-500 text-xs">
        Report Preview
      </div>

      {/* Simulated report header */}
      <div
        className="px-6 py-5 border-b border-white/10"
        style={{ borderBottomColor: branding.primaryColor + '30' }}
      >
        <div className="flex items-center justify-between">
          {/* Logo / company name */}
          <div className="flex items-center gap-2">
            {branding.logoUrl && !branding.hideSpotbotLogo ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-6 object-contain"
              />
            ) : (
              !branding.hideSpotbotLogo && (
                <span
                  className="font-bold text-sm"
                  style={{ color: branding.primaryColor }}
                >
                  {branding.companyName}
                </span>
              )
            )}
          </div>

          {/* Report title */}
          <span className="text-gray-400 text-xs">
            {branding.reportHeaderText}
          </span>
        </div>
      </div>

      {/* Simulated report body */}
      <div className="px-6 py-5 space-y-4">
        {/* Fake profile row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div>
            <div className="w-24 h-3 bg-white/20 rounded mb-1.5" />
            <div className="w-16 h-2 bg-white/10 rounded" />
          </div>
        </div>

        {/* Fake fraud score */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border-4 flex items-center
              justify-center text-lg font-bold text-white"
            style={{ borderColor: branding.primaryColor }}
          >
            72
          </div>
          <div>
            <div className="text-white text-sm font-medium mb-1">
              Fraud Score
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded-full inline-block"
              style={{
                backgroundColor: '#ef444420',
                color: '#ef4444',
              }}
            >
              🚨 Suspicious
            </div>
          </div>
        </div>

        {/* Fake signal bars */}
        <div className="space-y-2">
          {['Growth Velocity', 'Engagement', 'Comments', 'Spikes'].map(
            (label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="text-gray-500 w-24 truncate">
                  {label}
                </div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${[78, 65, 81, 64][i]}%`,
                      backgroundColor: branding.primaryColor,
                    }}
                  />
                </div>
                <div className="text-gray-400 w-6 text-right">
                  {[78, 65, 81, 64][i]}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Simulated footer */}
      <div className="px-6 py-3 border-t border-white/10 bg-white/3">
        <div className="text-gray-600 truncate">
          {branding.reportFooterText}
        </div>
        {!branding.hidePoweredBySpotbot && (
          <div className="text-gray-700 mt-0.5">
            Powered by Spotbot
          </div>
        )}
      </div>
    </div>
  )
}
