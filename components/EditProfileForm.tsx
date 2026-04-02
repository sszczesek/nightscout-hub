'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  display_name: string
  nightscout_url: string
  access_token: string | null
}

export default function EditProfileForm({
  profile,
}: {
  profile: Profile
}) {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [nightscoutUrl, setNightscoutUrl] = useState(profile.nightscout_url || '')
  const [accessToken, setAccessToken] = useState(profile.access_token || '')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        nightscout_url: nightscoutUrl,
        access_token: accessToken || null,
      })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Profile updated successfully.')
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this profile?')
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
      setDeleting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Profile Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Paige"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Nightscout URL</label>
        <input
          type="url"
          value={nightscoutUrl}
          onChange={(e) => setNightscoutUrl(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://your-nightscout-site.com"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Access Token</label>
        <input
          type="text"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Optional"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="border px-4 py-2 rounded-lg"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </form>
  )
}
