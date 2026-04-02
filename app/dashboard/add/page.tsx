'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AddProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [nightscoutUrl, setNightscoutUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!displayName.trim()) {
      setError('Display name is required.')
      setSaving(false)
      return
    }

    if (!isValidHttpUrl(nightscoutUrl)) {
      setError('Enter a valid Nightscout URL starting with http:// or https://')
      setSaving(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      setSaving(false)
      return
    }

    // 🔥 Get billing info
    const { data: billing } = await supabase
      .from('user_billing')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const isGrandfathered = billing?.is_grandfathered === true
    const hasActiveSubscription = billing?.subscription_status === 'active'
    const plan = billing?.plan

    // 🔥 Get current profile count
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const currentCount = count || 0

    // 🔥 Determine max allowed
    let maxProfiles = 1

    if (isGrandfathered) {
      maxProfiles = Infinity
    } else if (hasActiveSubscription && plan === 'pro') {
      maxProfiles = Infinity
    } else if (hasActiveSubscription && plan === 'basic') {
      maxProfiles = 2
    }

    // 🔥 Enforce limit
    if (currentCount >= maxProfiles) {
      router.push('/pricing?reason=limit')
      setSaving(false)
      return
    }

    // 🔥 Save profile
    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      display_name: displayName.trim(),
      nightscout_url: nightscoutUrl.trim(),
      access_token: accessToken.trim() || null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // 🔥 After first save → force payment if not subscribed
    if (!isGrandfathered && !hasActiveSubscription) {
      router.push('/pricing?reason=unlock')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Nightscout Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Nightscout URL"
          value={nightscoutUrl}
          onChange={(e) => setNightscoutUrl(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Read-only token (optional)"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />

        <button
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </main>
  )
}
