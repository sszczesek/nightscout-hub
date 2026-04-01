import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function mapDirection(direction?: string | null) {
  const map: Record<string, string> = {
    DoubleUp: '⇈',
    SingleUp: '↑',
    FortyFiveUp: '↗',
    Flat: '→',
    FortyFiveDown: '↘',
    SingleDown: '↓',
    DoubleDown: '⇊',
  }

  return map[direction || ''] || '→'
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.all(
    (profiles || []).map(async (profile) => {
      try {
        const url = new URL('/api/v1/entries.json?count=1', profile.nightscout_url)

        const headers: HeadersInit = {}
        if (profile.access_token) {
          headers['api-secret'] = profile.access_token
        }

        const response = await fetch(url.toString(), {
          headers,
          cache: 'no-store',
        })

        if (!response.ok) {
          return {
            id: profile.id,
            display_name: profile.display_name,
            nightscout_url: profile.nightscout_url,
            error: `Nightscout returned ${response.status}`,
          }
        }

        const data = await response.json()
        const latest = data?.[0]

        return {
          id: profile.id,
          display_name: profile.display_name,
          nightscout_url: profile.nightscout_url,
          bg: latest?.sgv ?? null,
          direction: latest?.direction ?? null,
          arrow: mapDirection(latest?.direction),
          date: latest?.dateString ?? null,
        }
      } catch {
        return {
          id: profile.id,
          display_name: profile.display_name,
          nightscout_url: profile.nightscout_url,
          error: 'Failed to fetch reading',
        }
      }
    })
  )

  return NextResponse.json(results)
}