'use client'

import { FormEvent, useEffect, useState } from 'react'

export default function SupportPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.email) {
          setEmail(data.email)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          profileUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setSuccess('Your message has been sent.')
      setSubject('')
      setMessage('')
      setProfileUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Support</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 bg-black border border-gray-700"
        />

        <input
          placeholder="Email"
          value={email}
          disabled
          className="w-full p-2 bg-black border border-gray-700 opacity-70"
        />

        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full p-2 bg-black border border-gray-700"
        />

        <input
          placeholder="Profile URL (optional)"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          className="w-full p-2 bg-black border border-gray-700"
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          className="w-full p-2 bg-black border border-gray-700"
        />

        {success && <div className="text-green-400">{success}</div>}
        {error && <div className="text-red-400">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-4 py-2"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  )
}
