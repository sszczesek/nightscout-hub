import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID!
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

function mapPlanFromPriceId(priceId?: string | null) {
  if (priceId === BASIC_PRICE_ID) return 'basic'
  if (priceId === PRO_PRICE_ID) return 'pro'
  return null
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.user_id
      const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id ?? null
        const plan = mapPlanFromPriceId(priceId)

        const { error } = await supabase.from('user_billing').upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          subscription_status: subscription.status,
          plan,
        })

        if (error) {
          console.error('Supabase upsert error:', error)
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription
      const stripeCustomerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id ?? null

      if (stripeCustomerId) {
        const priceId = subscription.items.data[0]?.price?.id ?? null
        const plan =
          event.type === 'customer.subscription.deleted'
            ? null
            : mapPlanFromPriceId(priceId)

        const { data: billingRow, error: lookupError } = await supabase
          .from('user_billing')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle()

        if (lookupError) {
          console.error('Supabase lookup error:', lookupError)
        }

        if (billingRow?.user_id) {
          const { error: updateError } = await supabase
            .from('user_billing')
            .update({
              subscription_status: subscription.status,
              plan,
            })
            .eq('user_id', billingRow.user_id)

          if (updateError) {
            console.error('Supabase update error:', updateError)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
