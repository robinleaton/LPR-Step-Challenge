import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, challengeTitle, startDate, endDate, prize } = await request.json()

    await resend.emails.send({
      from: 'LPR Step Challenge <noreply@steps.leaton.co.nz>',
      to: email,
      subject: `You're in! ${challengeTitle} starts ${startDate} 🏃`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: #0047AB; width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: white;">LPR</div>
          </div>
          <h1 style="text-align: center; color: #ffffff; font-size: 22px; margin-bottom: 8px;">Welcome, ${name}! 🎉</h1>
          <p style="text-align: center; color: #94a3b8; margin-bottom: 32px;">You're officially signed up for the <strong style="color: #ffffff;">${challengeTitle}</strong>.</p>

          <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0;">Starts</p>
                <p style="color: #ffffff; font-weight: bold; margin: 4px 0 0;">${startDate}</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">Ends</p>
                <p style="color: #ffffff; font-weight: bold; margin: 4px 0 0;">${endDate}</p>
              </div>
            </div>
            ${prize ? `<div style="background: #451a03; border-radius: 8px; padding: 12px; text-align: center; margin-top: 12px;">
              <p style="color: #f59e0b; font-size: 20px; font-weight: bold; margin: 0;">🏆 ${prize} up for grabs</p>
            </div>` : ''}
          </div>

          <h2 style="color: #ffffff; font-size: 16px; margin-bottom: 16px;">How it works</h2>
          <div style="space-y: 12px;">
            ${['Walk every day and rack up as many steps as you can.', 'Each night, take a screenshot of your step count in your fitness app.', 'Submit your photo before <strong style="color:#f59e0b;">11:59pm</strong> — late submissions cannot be counted.', 'The person with the most total steps at the end wins the prize!'].map((s, i) => `
              <div style="display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start;">
                <div style="background: #0047AB; min-width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">${i + 1}</div>
                <p style="color: #94a3b8; margin: 0; line-height: 1.5;">${s}</p>
              </div>`).join('')}
          </div>

          <div style="background: #450a0a; border: 1px solid #7f1d1d; border-radius: 8px; padding: 12px; margin: 24px 0;">
            <p style="color: #f87171; margin: 0; font-size: 14px;">⚠️ <strong>Important:</strong> Steps must be submitted before 11:59pm on the same day. You cannot go back and add steps for previous days.</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://steps.leaton.co.nz/dashboard" style="background: #0047AB; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Dashboard →</a>
          </div>

          <p style="text-align: center; color: #475569; font-size: 12px; margin-top: 32px;">Good luck — may the best walker win! 🏆<br/>Leaton Performance & Rehab</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
