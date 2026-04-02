'use client'

import { useState } from 'react'

export default function PricingClient({
  reason,
}: {
  reason: string | null
}) {
  const [loadingPlan, setLoadingPlan] = useState<'basic' | 'pro' | null>(null)
  const [error, setError] = useState('')

  async function checkout(plan: 'basic' | 'pro') {
    try {
      setError('')
      setLoadingPlan(plan)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const contentType = res.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Checkout route did not return JSON. ${text.slice(0, 120)}`)
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data.url) {
        throw new Error('Missing checkout URL.')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
      setLoadingPlan(null)
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Unlock Your Live Nightscout Dashboard</h1>

        {reason === 'unlock' ? (
          <p className="text-gray-300">
            Your profile was saved successfully. Subscribe now to unlock your real Nightscout data and replace the demo grid.
          </p>
        ) : reason === 'limit' ? (
          <p className="text-gray-300">
            You’ve reached your current profile limit. Upgrade your plan to add more Nightscout profiles.
          </p>
        ) : (
          <p className="text-gray-300">
            Choose the plan that fits your household.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-2">Basic</h2>
          <p className="text-3xl font-bold mb-4">
            $5<span className="text-base font-normal">/month</span>
          </p>
          <ul className="text-sm text-gray-300 space-y-2 mb-6">
            <li>Up to 2 Nightscout profiles</li>
            <li>Live BG, COB, and IOB grid</li>
            <li>Simple household monitoring</li>
          </ul>
          <button
            onClick={() => checkout('basic')}
            disabled={loadingPlan !== null}
            className="w-full bg-white text-black px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loadingPlan === 'basic' ? 'Loading...' : 'Choose Basic'}
          </button>
        </div>

        <div className="border rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-2">Pro</h2>
          <p className="text-3xl font-bold mb-4">
            $10<span className="text-base font-normal">/month</span>
          </p>
          <ul className="text-sm text-gray-300 space-y-2 mb-6">
            <li>Unlimited Nightscout profiles</li>
            <li>Live BG, COB, and IOB grid</li>
            <li>Best for larger families or caregivers</li>
          </ul>
          <button
            onClick={() => checkout('pro')}
            disabled={loadingPlan !== null}
            className="w-full bg-white text-black px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loadingPlan === 'pro' ? 'Loading...' : 'Choose Pro'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center mt-6 break-words">{error}</p>
      )}
    </main>
  )
}
