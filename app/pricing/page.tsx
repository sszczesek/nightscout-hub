import PricingClient from '@/components/PricingClient'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const reason = params?.reason ?? null

  return <PricingClient reason={reason} />
}
