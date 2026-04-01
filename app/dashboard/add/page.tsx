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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    if (!isValidHttpUrl(nightscoutUrl)) {
      setError('Enter a valid Nightscout URL starting with http:// or https://')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      return
    }

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      display_name: displayName.trim(),
      nightscout_url: nightscoutUrl.trim(),
      access_token: accessToken.trim() || null,
    })

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
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

        <button className="bg-black text-white px-4 py-2 rounded">
          Save profile
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </main>
  )
}