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

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
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
        const entriesUrl = new URL('/api/v1/entries.json?count=1', profile.nightscout_url)
        const deviceStatusUrl = new URL('/api/v1/devicestatus.json?count=1', profile.nightscout_url)

        const headers: HeadersInit = {}
        if (profile.access_token) {
          headers['api-secret'] = profile.access_token
        }

        const [entriesResponse, deviceStatusResponse] = await Promise.all([
          fetch(entriesUrl.toString(), {
            headers,
            cache: 'no-store',
          }),
          fetch(deviceStatusUrl.toString(), {
            headers,
            cache: 'no-store',
          }),
        ])

        if (!entriesResponse.ok) {
          return {
            id: profile.id,
            display_name: profile.display_name,
            nightscout_url: profile.nightscout_url,
            error: `Nightscout returned ${entriesResponse.status}`,
          }
        }

        const entriesData = await entriesResponse.json()
        const latestEntry = entriesData?.[0]

        let iob: number | null = null
        let cob: number | null = null

        if (deviceStatusResponse.ok) {
          const deviceStatusData = await deviceStatusResponse.json()
          const latestStatus = deviceStatusData?.[0]

          iob = firstNumber(
            latestStatus?.loop?.iob?.iob,
            latestStatus?.openaps?.iob?.iob,
            latestStatus?.openaps?.suggested?.IOB,
            latestStatus?.openaps?.enacted?.IOB,
            latestStatus?.loop?.iob,
            latestStatus?.iob
          )

          cob = firstNumber(
            latestStatus?.loop?.cob?.cob,
            latestStatus?.openaps?.suggested?.COB,
            latestStatus?.openaps?.suggested?.mealCOB,
            latestStatus?.openaps?.enacted?.COB,
            latestStatus?.loop?.cob,
            latestStatus?.cob
          )
        }

        return {
          id: profile.id,
          display_name: profile.display_name,
          nightscout_url: profile.nightscout_url,
          bg: latestEntry?.sgv ?? null,
          direction: latestEntry?.direction ?? null,
          arrow: mapDirection(latestEntry?.direction),
          date: latestEntry?.dateString ?? null,
          iob,
          cob,
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
