import { redirect } from 'next/navigation'
import Link from 'next/link'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProfilesGrid from '@/components/ProfilesGrid'
import LogoutButton from '@/components/LogoutButton'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID!
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

function mapPlanFromPriceId(priceId?: string | null) {
  if (priceId === BASIC_PRICE_ID) return 'basic'
  if (priceId === PRO_PRICE_ID) return 'pro'
  return null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If user just returned from Stripe Checkout, sync billing immediately
  // using the Checkout Session so the dashboard unlocks right away.
  if (params?.checkout === 'success' && params?.session_id) {
    try {
      const admin = createAdminClient()
      const session = await stripe.checkout.sessions.retrieve(params.session_id)

      const returnedUserId = session.metadata?.user_id
      const stripeCustomerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

      if (returnedUserId === user.id && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id ?? null
        const plan = mapPlanFromPriceId(priceId)

        const { error } = await admin.from('user_billing').upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          subscription_status: subscription.status,
          plan,
        })

        if (error) {
          console.error('Dashboard checkout sync upsert error:', error)
        }
      }
    } catch (error) {
      console.error('Dashboard checkout sync error:', error)
    }
  }

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

      {params?.checkout === 'success' && canViewRealProfiles && (
        <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-100">
          Your subscription is active. Your live Nightscout dashboard is now unlocked.
        </div>
      )}

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
