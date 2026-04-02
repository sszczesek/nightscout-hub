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
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 })
    }

    if (!process.env.STRIPE_BASIC_PRICE_ID || !process.env.STRIPE_PRO_PRICE_ID) {
      return NextResponse.json({ error: 'Missing Stripe price environment variables' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SITE_URL' }, { status: 500 })
    }

    const priceId = plan === 'basic' ? BASIC_PRICE_ID : PRO_PRICE_ID

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Supabase auth.getUser error:', userError)
      return NextResponse.json({ error: 'Could not read authenticated user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating checkout session for user:', user.id)
    console.log('Plan:', plan)
    console.log('Price ID:', priceId)
    console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
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

    console.log('Checkout session created:', session.id)

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message,
          type: error.type,
          code: error.code ?? null,
        },
        { status: 500 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
