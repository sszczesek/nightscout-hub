import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'alerts@nightscouthub.com',
      to: process.env.SIGNUP_NOTIFY_TO_EMAIL!,
      subject: 'New Nightscout Hub signup',
      html: `
        <h2>New user signup</h2>
        <p><strong>Email:</strong> ${email}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup notification failed:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
