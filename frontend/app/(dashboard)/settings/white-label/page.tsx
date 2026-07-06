'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import {
  useBranding,
  useUpdateBranding,
  useResetBranding,
} from '@/hooks/use-white-label'
import { useToast } from '@/hooks/use-toast'
import { BrandingPreview } from '@/components/white-label/branding-preview'
import { LogoUploader } from '@/components/white-label/logo-uploader'
import { ColorPicker } from '@/components/white-label/color-picker'
import { UpgradeWall } from '@/components/billing/upgrade-wall'
import { Palette } from 'lucide-react'

export default function WhiteLabelPage() {
  const { data: stats } = useDashboardStats()
  const { data: branding } = useBranding()
  const updateBranding = useUpdateBranding()
  const resetBranding = useResetBranding()
  const { toast } = useToast()

  const isEnterprise = stats?.planName === 'enterprise'

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [accentColor, setAccentColor] = useState('#8b5cf6')
  const [reportFooterText, setReportFooterText] = useState('')
  const [reportHeaderText, setReportHeaderText] = useState('')
  const [hidePoweredBy, setHidePoweredBy] = useState(false)
  const [hideLogo, setHideLogo] = useState(false)
  const [prevBranding, setPrevBranding] = useState(branding)

  // Populate form from fetched branding
  if (branding !== prevBranding) {
    setPrevBranding(branding)
    if (branding) {
      setCompanyName(branding.companyName)
      setPrimaryColor(branding.primaryColor)
      setAccentColor(branding.accentColor)
      setReportFooterText(branding.reportFooterText)
      setReportHeaderText(branding.reportHeaderText)
      setHidePoweredBy(branding.hidePoweredBySpotbot)
      setHideLogo(branding.hideSpotbotLogo)
    }
  }

  // Track changes
  const isDirty = branding ? (
    companyName !== branding.companyName ||
    primaryColor !== branding.primaryColor ||
    accentColor !== branding.accentColor ||
    reportFooterText !== branding.reportFooterText ||
    reportHeaderText !== branding.reportHeaderText ||
    hidePoweredBy !== branding.hidePoweredBySpotbot ||
    hideLogo !== branding.hideSpotbotLogo
  ) : false

  async function handleSave() {
    try {
      await updateBranding.mutateAsync({
        companyName,
        primaryColor,
        accentColor,
        reportFooterText,
        reportHeaderText,
        hidePoweredBySpotbot: hidePoweredBy,
        hideSpotbotLogo: hideLogo,
      })
      toast.success('Branding settings saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? (err.message ?? 'Failed to save branding') : 'Failed to save branding')
    }
  }

  async function handleReset() {
    try {
      await resetBranding.mutateAsync()
      toast.success('Branding reset to defaults')
    } catch {
      toast.error('Failed to reset branding')
    }
  }

  // Show upgrade wall for non-enterprise
  if (!isEnterprise && stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="mt-8">
          <UpgradeWall
            used={stats.scansUsed}
            limit={stats.scanLimit}
            plan={stats.planName}
            customMessage="White label reports are available on Enterprise plan only."
          />
          <div className="mt-6 text-center">
            <a
              href="mailto:sales@spotbot.io"
              className="text-indigo-400 hover:text-indigo-300
                transition-colors text-sm"
            >
              Contact sales@spotbot.io to upgrade →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader />
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={resetBranding.isPending}
            className="px-4 py-2 border border-white/10
              text-gray-400 hover:text-white text-sm
              rounded-xl transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || updateBranding.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500
              disabled:opacity-50 text-white text-sm font-medium
              rounded-xl transition-colors"
          >
            {updateBranding.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT — Settings */}
        <div className="space-y-6">

          {/* Logo upload */}
          <SettingsCard title="Logo">
            <LogoUploader
              currentLogoUrl={branding?.logoUrl ?? null}
              companyName={companyName}
            />
          </SettingsCard>

          {/* Company name */}
          <SettingsCard title="Company Name">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Agency Name"
              maxLength={255}
              className="w-full px-4 py-2.5 bg-white/5 border
                border-white/10 rounded-xl text-white text-sm
                placeholder:text-gray-600 outline-none
                focus:border-indigo-500 transition-colors"
            />
          </SettingsCard>

          {/* Colors */}
          <SettingsCard title="Brand Colors">
            <div className="space-y-4">
              <ColorPicker
                label="Primary Color"
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorPicker
                label="Accent Color"
                value={accentColor}
                onChange={setAccentColor}
              />
            </div>
          </SettingsCard>

          {/* Report text */}
          <SettingsCard title="Report Text">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportHeaderText}
                  onChange={(e) => setReportHeaderText(e.target.value)}
                  placeholder="Fraud Analysis Report"
                  maxLength={255}
                  className="w-full px-4 py-2.5 bg-white/5 border
                    border-white/10 rounded-xl text-white text-sm
                    placeholder:text-gray-600 outline-none
                    focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Report Footer Text
                </label>
                <textarea
                  value={reportFooterText}
                  onChange={(e) => setReportFooterText(e.target.value)}
                  placeholder="Generated by Your Agency · agency.com"
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border
                    border-white/10 rounded-xl text-white text-sm
                    placeholder:text-gray-600 outline-none
                    focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Spotbot branding toggles */}
          <SettingsCard title="Spotbot Branding">
            <div className="space-y-4">
              <ToggleRow
                label="Hide Spotbot Logo"
                description="Remove Spotbot logo from reports"
                checked={hideLogo}
                onChange={setHideLogo}
              />
              <ToggleRow
                label="Hide Powered by Spotbot"
                description='Remove "Powered by Spotbot" from footer'
                checked={hidePoweredBy}
                onChange={setHidePoweredBy}
              />
            </div>
          </SettingsCard>
        </div>

        {/* RIGHT — Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="text-sm font-medium text-gray-400 mb-3">
            Preview
          </div>
          <BrandingPreview
            branding={{
              companyName,
              logoUrl: branding?.logoUrl ?? null,
              primaryColor,
              accentColor,
              reportFooterText,
              reportHeaderText,
              hidePoweredBySpotbot: hidePoweredBy,
              hideSpotbotLogo: hideLogo,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center
        gap-3">
        <Palette size={22} className="text-indigo-400" />
        White Label
      </h1>
      <p className="text-gray-400 text-sm mt-1">
        Customize reports with your agency branding
      </p>
    </div>
  )
}

function SettingsCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-medium text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-white">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors
          shrink-0 ${checked ? 'bg-indigo-600' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full
          transition-transform ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </button>
    </div>
  )
}
