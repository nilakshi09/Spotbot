'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useInvoices } from '@/hooks/use-invoices'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useToast } from '@/hooks/use-toast'
import { CurrentPlanCard } from '@/components/billing/current-plan-card'
import { PlanGrid } from '@/components/billing/plan-grid'
import { InvoiceHistory } from '@/components/billing/invoice-history'
import { FreePlanBanner } from '@/components/billing/free-plan-banner'
import { useQueryClient } from '@tanstack/react-query'

export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices()
  const { data: stats } = useDashboardStats()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Handle Stripe redirect back to billing page
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const planName = subscription?.planName || 'your new plan'
      toast.success(`🎉 Welcome to ${planName}! Your plan is now active.`)
      
      // Invalidate all billing-related queries to refetch
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      
      // Remove query params from URL without reload
      window.history.replaceState({}, '', '/billing')
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled. No charges were made.')
      window.history.replaceState({}, '', '/billing')
    }
  }, [searchParams, queryClient, subscription?.planName, toast])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-[#8899aa] text-sm mt-1">
          Manage your plan and payment details
        </p>
      </div>

      {/* Free Trial Banner */}
      {subscription?.plan === 'free' && stats?.trial && (
        <FreePlanBanner trial={stats.trial} />
      )}

      {/* Current Plan */}
      <CurrentPlanCard
        subscription={subscription}
        isLoading={subLoading}
      />

      {/* Plan Upgrade Grid */}
      <PlanGrid
        currentPlan={subscription?.plan ?? 'free'}
        isLoading={subLoading}
      />

      {/* Invoice History */}
      <InvoiceHistory
        invoices={invoicesData?.invoices ?? []}
        isLoading={invoicesLoading}
      />
    </div>
  )
}
