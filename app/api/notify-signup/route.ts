import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-signup-secret')
    if (secret !== process.env.SIGNUP_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const record = body?.record ?? body
    const email = record?.email ?? 'unknown'
    const userId = record?.user_id ?? 'unknown'
    const createdAt = record?.created_at ?? new Date().toISOString()

    const { error } = await resend.emails.send({
      from: process.env.SIGNUP_NOTIFY_FROM_EMAIL!,
      to: process.env.SIGNUP_NOTIFY_TO_EMAIL!,
      subject: 'New Nightscout Hub signup',
      html: `
        <h2>New signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Created:</strong> ${createdAt}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
