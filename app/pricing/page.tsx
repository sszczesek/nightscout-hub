import PricingClient from '@/components/PricingClient'
import { createClient } from '@/lib/supabase/server'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const reason = params?.reason ?? null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlan: string | null = null

  if (user) {
    const { data: billing } = await supabase
      .from('user_billing')
      .select('plan, subscription_status, is_grandfathered')
      .eq('user_id', user.id)
      .maybeSingle()

    if (billing?.is_grandfathered) {
      currentPlan = 'grandfathered'
    } else if (billing?.subscription_status === 'active' && billing?.plan) {
      currentPlan = billing.plan
    }
  }

  return <PricingClient reason={reason} currentPlan={currentPlan} />
}
