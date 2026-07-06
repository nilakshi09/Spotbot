'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Building2, CheckCircle } from 'lucide-react'
import { useContactSales } from '@/hooks/use-contact-sales'
import { useAuth } from '@/contexts/auth-context'

interface ContactSalesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactSalesModal({
  open,
  onOpenChange,
}: ContactSalesModalProps) {
  const { user } = useAuth()
  const contactSales = useContactSales()

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState(user?.name ?? '')
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [teamSize, setTeamSize] = useState('')
  const [scansPerMonth, setScansPerMonth] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!companyName) newErrors.companyName = 'Company name is required'
    if (!contactName) newErrors.contactName = 'Your name is required'
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Valid email is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    try {
      await contactSales.mutateAsync({
        companyName,
        contactName,
        contactEmail,
        teamSize: teamSize || undefined,
        estimatedScansPerMonth: scansPerMonth || undefined,
        message: message || undefined,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? (err.message ?? 'Failed to submit. Please try again.') : 'Failed to submit. Please try again.' })
    }
  }

  function handleClose() {
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60
          backdrop-blur-sm z-50" />

        <Dialog.Content className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-lg z-50
          bg-gray-900 border border-white/10 rounded-2xl
          p-6 shadow-2xl max-h-[90vh] overflow-y-auto
        ">
          {success ? (
            // Success state
            <div className="text-center py-6">
              <CheckCircle size={40} className="text-green-400
                mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Request Sent!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Our team will reach out within 1 business day to
                discuss your Enterprise plan.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500
                  text-white font-medium rounded-xl transition-colors
                  text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-400/10 border
                  border-amber-400/20 rounded-xl flex items-center
                  justify-center">
                  <Building2 size={18} className="text-amber-400" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-semibold
                    text-white">
                    Contact Sales
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-400">
                    Tell us about your needs — we&apos;ll build a custom plan
                  </Dialog.Description>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <FormField
                  label="Company Name"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Acme Agency"
                  error={errors.companyName}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Your Name"
                    value={contactName}
                    onChange={setContactName}
                    placeholder="Jane Smith"
                    error={errors.contactName}
                  />
                  <FormField
                    label="Email"
                    value={contactEmail}
                    onChange={setContactEmail}
                    placeholder="jane@agency.com"
                    type="email"
                    error={errors.contactEmail}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Team Size
                    </label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border
                        border-white/10 rounded-xl text-white text-sm
                        outline-none focus:border-indigo-500"
                    >
                      <option value="">Select...</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="200+">200+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Est. Scans/Month
                    </label>
                    <select
                      value={scansPerMonth}
                      onChange={(e) => setScansPerMonth(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border
                        border-white/10 rounded-xl text-white text-sm
                        outline-none focus:border-indigo-500"
                    >
                      <option value="">Select...</option>
                      <option value="500-1000">500-1,000</option>
                      <option value="1000-5000">1,000-5,000</option>
                      <option value="5000+">5,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">
                    Tell us about your needs (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What features matter most to you?"
                    rows={3}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 bg-white/5 border
                      border-white/10 rounded-xl text-white text-sm
                      placeholder:text-gray-600 outline-none
                      focus:border-indigo-500 resize-none"
                  />
                </div>

                {errors.submit && (
                  <div className="bg-red-400/10 border border-red-400/20
                    rounded-xl px-4 py-3 text-red-400 text-sm">
                    {errors.submit}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={contactSales.isPending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500
                    disabled:opacity-50 text-white font-semibold
                    rounded-xl transition-colors"
                >
                  {contactSales.isPending
                    ? 'Sending...'
                    : 'Send Request'}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  error?: string
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 bg-white/5 border
          rounded-xl text-white text-sm placeholder:text-gray-600
          outline-none focus:border-indigo-500 transition-colors
          ${error ? 'border-red-400' : 'border-white/10'}`}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
