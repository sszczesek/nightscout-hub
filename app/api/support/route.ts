import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const { name, email, subject, message, profileUrl } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await resend.emails.send({
      from: process.env.SUPPORT_FROM_EMAIL!,
      to: process.env.SUPPORT_TO_EMAIL!,
      subject: `Support: ${subject}`,
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Profile:</b> ${profileUrl || 'N/A'}</p>
        <hr />
        <p>${message}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SUPPORT ERROR:', error)
    return NextResponse.json({ error: 'Failed to send support request' }, { status: 500 })
  }
}
