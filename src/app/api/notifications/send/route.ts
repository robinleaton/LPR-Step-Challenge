import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { title, body, type, targetAll, userId } = await req.json()

    let userIds: string[] = []

    if (targetAll) {
      const { data: users } = await supabase.from('profiles').select('id')
      userIds = (users || []).map(u => u.id)
    } else if (userId) {
      userIds = [userId]
    }

    // Insert notifications into DB
    const notifications = userIds.map(uid => ({
      user_id: uid, title, body, type: type || 'general',
    }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }

    // Send emails to users who opted in
    const { data: emailUsers } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('id', userIds)
      .eq('notification_email', true)

    if (emailUsers && emailUsers.length > 0 && process.env.RESEND_API_KEY) {
      for (const user of emailUsers) {
        await resend.emails.send({
          from: 'LPR Step Challenge <noreply@leatonperformance.co.nz>',
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 32px; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #0047AB; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;">
                  LPR Step Challenge
                </div>
              </div>
              <h2 style="color: #3B82F6; margin-bottom: 12px;">${title}</h2>
              <p style="color: #9CA3AF; line-height: 1.6;">${body}</p>
              <div style="margin-top: 32px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="background: #0047AB; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Open App →
                </a>
              </div>
              <p style="color: #4B5563; font-size: 12px; margin-top: 24px; text-align: center;">
                You're receiving this because you have email notifications enabled.<br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/notifications/settings" style="color: #3B82F6;">Manage preferences</a>
              </p>
            </div>
          `,
        }).catch(err => console.error('Email error:', err))
      }
    }

    return NextResponse.json({ ok: true, sent: userIds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
