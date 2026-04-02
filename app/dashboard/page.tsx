import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProfilesGrid from '@/components/ProfilesGrid'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: billing } = await supabase
    .from('user_billing')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const isGrandfathered = billing?.is_grandfathered === true
  const hasActiveSubscription = billing?.subscription_status === 'active'
  const canViewRealProfiles = isGrandfathered || hasActiveSubscription

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Nightscout Profiles</h1>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/add" className="underline">
            Add profile
          </Link>

          {(hasActiveSubscription || billing?.stripe_customer_id) && (
            <Link href="/billing" className="underline">
              Billing
            </Link>
          )}

          <LogoutButton />
        </div>
      </div>

      {!canViewRealProfiles && (
        <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          You’re viewing demo data right now. Add your profile and subscribe to unlock your live Nightscout grid.
        </div>
      )}

      <ProfilesGrid canViewRealProfiles={canViewRealProfiles} />

      <p className="text-xs text-gray-500 mt-10 text-center">
        Nightscout Hub is for informational purposes only and is not a medical device.
        Do not use this data for medical decisions. Always consult a healthcare professional.
      </p>
    </main>
  )
}
