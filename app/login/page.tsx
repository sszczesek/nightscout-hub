'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) return setError(error.message)

      if (data?.user?.email) {
        await fetch('/api/notify-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.user.email }),
        })
      }

      alert('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setError(error.message)
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nightscout Hub</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2 rounded">
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <div className="mt-3">
        <a href="/forgot-password" className="text-sm underline">
          Forgot password?
        </a>
      </div>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      <button
        className="mt-4 underline"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        Switch to {mode === 'login' ? 'sign up' : 'login'}
      </button>
    </main>
  )
}
