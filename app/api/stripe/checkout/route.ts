import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID!
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

export async function POST(req: Request) {
  try {
    const { plan } = await req.json()

    if (plan !== 'basic' && plan !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY')
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    if (!process.env.STRIPE_BASIC_PRICE_ID || !process.env.STRIPE_PRO_PRICE_ID) {
      console.error('Missing Stripe price environment variables')
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('Missing NEXT_PUBLIC_SITE_URL')
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    const priceId = plan === 'basic' ? BASIC_PRICE_ID : PRO_PRICE_ID

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Supabase auth.getUser error:', userError)
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        selected_plan: plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
