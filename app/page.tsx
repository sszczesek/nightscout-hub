import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto text-center">

        {/* HERO */}
        <h1 className="text-5xl font-bold mb-6">
          Track multiple Nightscout profiles in one simple dashboard
        </h1>

        <p className="text-lg text-gray-300 mb-8">
          Nightscout Hub helps parents, caregivers, and families monitor blood glucose,
          insulin on board (IOB), and carbs on board (COB) across multiple Nightscout profiles —
          all in one place.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
          >
            Get Started
          </Link>

          <Link
            href="/dashboard"
            className="border border-white px-6 py-3 rounded-lg font-semibold"
          >
            View Dashboard
          </Link>
        </div>

        {/* BENEFITS */}
        <div className="text-left space-y-4 mb-12">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Why Nightscout Hub?
          </h2>

          <ul className="space-y-3 text-gray-300">
            <li>• View multiple Nightscout profiles in one place</li>
            <li>• See BG, trend arrows, IOB, and COB at a glance</li>
            <li>• Designed for parents, caregivers, and families</li>
            <li>• No switching between tabs or devices</li>
          </ul>
        </div>

        {/* HOW IT WORKS */}
        <div className="text-left space-y-4 mb-12">
          <h2 className="text-2xl font-semibold text-center mb-4">
            How it works
          </h2>

          <ol className="space-y-3 text-gray-300">
            <li>1. Add your Nightscout profile(s)</li>
            <li>2. Connect your data</li>
            <li>3. View everything in one clean dashboard</li>
          </ol>
        </div>

        {/* SIMPLE EXPLANATION */}
        <div className="text-left space-y-3 mb-12">
          <h2 className="text-xl font-semibold text-center mb-3">
            What you’ll see
          </h2>

          <p className="text-gray-300 text-sm">
            <b>BG (Blood Glucose):</b> Current glucose level
          </p>
          <p className="text-gray-300 text-sm">
            <b>IOB (Insulin on Board):</b> Active insulin still working
          </p>
          <p className="text-gray-300 text-sm">
            <b>COB (Carbs on Board):</b> Carbs still being processed
          </p>
        </div>

        {/* CTA AGAIN */}
        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
          >
            Start Monitoring
          </Link>
        </div>

        {/* DISCLAIMER */}
        <p className="text-xs text-gray-500 text-center max-w-md mx-auto">
          Nightscout Hub was designed by Shane Szczesek to easily view multiple Nightscout
          pages at one time. Nightscout Hub is for informational purposes only and is not a
          medical device. Do not use this data for medical decisions. Always consult a
          healthcare professional.
        </p>

      </div>
    </main>
  )
}
