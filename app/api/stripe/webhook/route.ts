import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASIC_PRICE_ID = 'price_1THq6tJWbngsiaGgC33Lnro8'
const PRO_PRICE_ID = 'price_1THq7eJWbngsiaGgVrHsFKRv'

function mapPlanFromPriceId(priceId?: string | null) {
  if (priceId === BASIC_PRICE_ID) return 'basic'
  if (priceId === PRO_PRICE_ID) return 'pro'
  return null
}

export async function POST(req: Request) {
  console.log('--- WEBHOOK HIT ---')

  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('Webhook event type:', event.type)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('checkout.session.completed session:', session.id)
      console.log('session metadata:', session.metadata)

      const userId = session.metadata?.user_id
      const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

      console.log('userId:', userId)
      console.log('stripeCustomerId:', stripeCustomerId)
      console.log('subscriptionId:', subscriptionId)

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id ?? null
        const plan = mapPlanFromPriceId(priceId)

        console.log('priceId:', priceId)
        console.log('mapped plan:', plan)
        console.log('subscription.status:', subscription.status)

        const { error } = await supabase.from('user_billing').upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          subscription_status: subscription.status,
          plan,
        })

        if (error) {
          console.error('Supabase upsert error:', error)
        } else {
          console.log('Supabase upsert success for user:', userId)
        }
      } else {
        console.error('Missing userId or subscriptionId in checkout.session.completed')
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

      console.log('subscription event:', event.type)
      console.log('stripeCustomerId:', stripeCustomerId)

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
          } else {
            console.log('Supabase subscription update success for user:', billingRow.user_id)
          }
        } else {
          console.log('No billing row found yet for stripe customer:', stripeCustomerId)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
