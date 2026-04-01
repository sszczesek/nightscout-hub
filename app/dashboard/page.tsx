import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProfilesGrid from '@/components/ProfilesGrid'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Nightscout Profiles</h1>
        <Link href="/dashboard/add" className="underline">
          Add profile
        </Link>
      </div>

      <ProfilesGrid />
    </main>
  )
}