import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendSignupNotification(email: string) {
  try {
    await resend.emails.send({
      from: 'alerts@nightscouthub.com',
      to: process.env.SIGNUP_NOTIFY_TO_EMAIL!,
      subject: 'New user signup 🚀',
      html: `
        <h2>New user signed up</h2>
        <p>Email: ${email}</p>
      `,
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }
}
