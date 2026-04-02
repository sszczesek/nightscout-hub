'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Reading = {
  id: string
  display_name: string
  nightscout_url: string
  bg?: number | null
  arrow?: string
  date?: string | null
  iob?: number | null
  cob?: number | null
  error?: string
  isDemo?: boolean
}

type ProfilesGridProps = {
  canViewRealProfiles?: boolean
}

const demoProfiles: Reading[] = [
  {
    id: 'demo-1',
    display_name: 'Paige',
    nightscout_url: '#',
    bg: 148,
    arrow: '→',
    date: new Date(Date.now() - 2 * 60000).toISOString(),
    iob: 0.9,
    cob: 4.2,
    isDemo: true,
  },
  {
    id: 'demo-2',
    display_name: 'Tanner',
    nightscout_url: '#',
    bg: 212,
    arrow: '↗',
    date: new Date(Date.now() - 6 * 60000).toISOString(),
    iob: 1.8,
    cob: 12.5,
    isDemo: true,
  },
  {
    id: 'demo-3',
    display_name: 'Kerry',
    nightscout_url: '#',
    bg: 104,
    arrow: '→',
    date: new Date(Date.now() - 1 * 60000).toISOString(),
    iob: 0.3,
    cob: 0.0,
    isDemo: true,
  },
  {
    id: 'demo-4',
    display_name: 'Shane',
    nightscout_url: '#',
    bg: 126,
    arrow: '↘',
    date: new Date(Date.now() - 4 * 60000).toISOString(),
    iob: 0.7,
    cob: 2.1,
    isDemo: true,
  },
]

function getBgStatus(bg?: number | null) {
  if (bg == null) return ''
  if (bg < 70) return 'text-red-500'
  if (bg > 180) return 'text-yellow-400'
  return 'text-green-400'
}

function formatNumber(value?: number | null) {
  if (value == null) return '--'
  return Number(value).toFixed(1)
}

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return 'No recent reading'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now'

  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes === 1) return '1 min ago'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export default function ProfilesGrid({
  canViewRealProfiles = true,
}: ProfilesGridProps) {
  const [items, setItems] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [, setNowTick] = useState(Date.now())

  async function load() {
    if (!canViewRealProfiles) {
      setItems([])
      setLoading(false)
      setPageError('')
      return
    }

    try {
      setPageError('')
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch('/api/readings', {
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed with ${res.status}`)
      }

      const data = await res.json()
      setItems(data)
    } catch {
      setPageError('Could not load readings.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this profile?')
    if (!confirmed) return

    const res = await fetch('/api/profiles/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      load()
    } else {
      alert('Could not delete profile.')
    }
  }

  useEffect(() => {
    load()
    const loadTimer = setInterval(load, 60000)
    const clockTimer = setInterval(() => setNowTick(Date.now()), 30000)

    return () => {
      clearInterval(loadTimer)
      clearInterval(clockTimer)
    }
  }, [canViewRealProfiles])

  const visibleItems = useMemo(() => {
    return canViewRealProfiles ? items : demoProfiles
  }, [canViewRealProfiles, items])

  if (loading && canViewRealProfiles) return <p>Loading...</p>
  if (pageError && canViewRealProfiles) return <p className="text-red-600">{pageError}</p>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="border rounded-2xl p-4 block shadow-sm"
        >
          <div className="flex justify-between items-start gap-4">
            <a
              href={item.isDemo ? '#' : item.nightscout_url}
              target={item.isDemo ? undefined : '_blank'}
              rel={item.isDemo ? undefined : 'noreferrer'}
              onClick={(e) => {
                if (item.isDemo) e.preventDefault()
              }}
              className="block flex-1"
            >
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{item.display_name}</div>
                {item.isDemo && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-200">
                    Demo
                  </span>
                )}
              </div>

              {item.error ? (
                <div className="text-red-600 mt-2">{item.error}</div>
              ) : (
                <>
                  <div className={`text-4xl font-bold mt-2 ${getBgStatus(item.bg)}`}>
                    {item.bg ?? '--'} {item.arrow || ''}
                  </div>

                  <div className="text-sm text-gray-300 mt-2">
                    COB: {formatNumber(item.cob)}g
                  </div>

                  <div className="text-sm text-gray-300">
                    IOB: {formatNumber(item.iob)}u
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    Updated: {formatTimeAgo(item.date)}
                  </div>
                </>
              )}
            </a>

            {!item.isDemo && (
              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/dashboard/profiles/${item.id}/edit`}
                  className="text-sm underline"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-sm underline text-red-400"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
