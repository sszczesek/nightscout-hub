import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6">Nightscout Hub</h1>
        <p className="text-lg text-gray-300 mb-8">
          View multiple Nightscout profiles in one place with live BG readings and trend arrows.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
          >
            Log In / Sign Up
          </Link>

          <Link
            href="/dashboard"
            className="border border-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
