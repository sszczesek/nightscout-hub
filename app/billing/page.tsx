'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function openPortal() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const contentType = res.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Portal route did not return JSON. ${text.slice(0, 120)}`)
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Could not open billing portal.')
      }

      if (!data.url) {
        throw new Error('Missing portal URL.')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.')
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Billing</h1>
      <p className="text-gray-300 mb-6">
        Manage your subscription, payment method, and billing details.
      </p>

      <div className="flex gap-3">
        <button
          onClick={openPortal}
          disabled={loading}
          className="bg-white text-black px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Opening...' : 'Open customer portal'}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="border px-4 py-2 rounded-lg"
        >
          Back to dashboard
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-4 break-words">{error}</p>}
    </main>
  )
}
