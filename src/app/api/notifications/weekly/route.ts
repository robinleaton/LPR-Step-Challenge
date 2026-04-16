import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// This route is called by Vercel Cron every Monday at 7:30am NZT
// It generates a personalised push notification for every active challenge participant
// using their motivation_why to customise the message via Claude

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function GET(request: Request) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: { userId: string; status: string; message?: string }[] = []

  try {
    // 1. Get all active challenges (running today)
    const { data: activeChallenges, error: challengeErr } = await supabase
      .from('challenges')
      .select('id, title, start_date, end_date')
      .lte('start_date', today)
      .gte('end_date', today)

    if (challengeErr || !activeChallenges?.length) {
      return NextResponse.json({ message: 'No active challenges today', results: [] })
    }

    for (const challenge of activeChallenges) {
      // 2. Get all participants for this challenge with their profiles
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select(`
          user_id,
          profiles (
            id,
            full_name,
            email,
            motivation_why
          )
        `)
        .eq('challenge_id', challenge.id)

      if (!participants?.length) continue

      // 3. Work out which week of the challenge we're in
      const startDate = new Date(challenge.start_date)
      const daysPassed = Math.floor((new Date().getTime() - startDate.getTime()) / 86400000)
      const weekNumber = Math.floor(daysPassed / 7) + 1

      // 4. Get leaderboard positions for this challenge
      const userIds = participants.map((p: any) => p.user_id)
      const { data: stepLogs } = await supabase
        .from('step_logs')
        .select('user_id, steps')
        .in('user_id', userIds)
        .gte('date', challenge.start_date)
        .lte('date', today)

      const stepsByUser: Record<string, number> = {}
      userIds.forEach((id: string) => { stepsByUser[id] = 0 })
      stepLogs?.forEach((log: any) => {
        stepsByUser[log.user_id] = (stepsByUser[log.user_id] || 0) + log.steps
      })

      const ranked = [...userIds].sort((a, b) => stepsByUser[b] - stepsByUser[a])

      // 5. Generate and send a personalised notification for each participant
      for (const participant of participants) {
        const profile = participant.profiles as any
        if (!profile?.email) continue

        const userId = participant.user_id
        const totalSteps = stepsByUser[userId] || 0
        const rank = ranked.indexOf(userId) + 1
        const totalParticipants = ranked.length
        const firstName = profile.full_name?.split(' ')[0] || 'there'
        const motivationWhy = profile.motivation_why?.trim()

        try {
          // 6. Ask Claude to write a personalised one-liner
          let notificationText = ''

          if (motivationWhy) {
            const prompt = `You are writing a short, punchy push notification for a step challenge app.

The person's name is ${firstName}.
They are in position ${rank} of ${totalParticipants} on the leaderboard.
They have walked ${totalSteps.toLocaleString()} steps so far.
It is week ${weekNumber} of the challenge.
Their personal reason for joining is: "${motivationWhy}"

Write ONE push notification message. Rules:
- Maximum 120 characters total
- Must reference their personal reason naturally (not word-for-word, but clearly inspired by it)
- Must feel human, warm and motivating — not corporate
- Include their rank if it's top 3, otherwise focus on the why
- End with one relevant emoji
- Do NOT use quotes around the message
- Return ONLY the message text, nothing else`

            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 100,
              messages: [{ role: 'user', content: prompt }],
            })

            notificationText = (response.content[0] as any).text?.trim() || ''
          } else {
            // Generic fallback if no why set
            notificationText = `Week ${weekNumber} check-in ${firstName} — you're in ${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} place. Log your steps today! 💪`
          }

          // 7. Send the notification email via Resend
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'LPR Step Challenge <noreply@leaton.co.nz>',
              to: profile.email,
              subject: `Week ${weekNumber} · ${challenge.title} 🔥`,
              html: buildEmailHtml({
                firstName,
                notificationText,
                rank,
                totalParticipants,
                totalSteps,
                weekNumber,
                challengeTitle: challenge.title,
                motivationWhy,
              }),
            }),
          })

          if (emailRes.ok) {
            results.push({ userId, status: 'sent', message: notificationText })
          } else {
            const err = await emailRes.text()
            results.push({ userId, status: 'email_failed', message: err })
          }

          // Small delay to avoid rate limiting Claude API
          await new Promise(r => setTimeout(r, 300))

        } catch (err: any) {
          results.push({ userId, status: 'error', message: err.message })
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status !== 'sent').length,
      results,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Email HTML template ──────────────────────────────────────────────────────
function buildEmailHtml({
  firstName,
  notificationText,
  rank,
  totalParticipants,
  totalSteps,
  weekNumber,
  challengeTitle,
  motivationWhy,
}: {
  firstName: string
  notificationText: string
  rank: number
  totalParticipants: number
  totalSteps: number
  weekNumber: number
  challengeTitle: string
  motivationWhy?: string
}) {
  const rankSuffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'
  const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#9ca3af' : rank === 3 ? '#d97706' : '#6b7280'

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b5bff,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏃</div>
      <span style="font-size:16px;font-weight:800;color:#ffffff;">LPR Step Challenge</span>
    </div>

    <!-- Week label -->
    <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 8px;">Week ${weekNumber} · ${challengeTitle}</p>

    <!-- Main message -->
    <div style="background:linear-gradient(135deg,#0d1233,#0a0a1a);border:1px solid rgba(59,91,255,0.3);border-radius:20px;padding:24px;margin-bottom:20px;">
      <p style="font-size:20px;font-weight:800;color:#ffffff;margin:0 0 8px;line-height:1.3;">${notificationText}</p>
      ${motivationWhy ? `<p style="font-size:12px;color:#6b7280;margin:12px 0 0;font-style:italic;">Your why: "${motivationWhy}"</p>` : ''}
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px;">
      <div style="background:#13131f;border:1px solid #1e1e35;border-radius:14px;padding:14px 10px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:${rankColor};">${rank}${rankSuffix}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px;font-weight:600;">Leaderboard</div>
      </div>
      <div style="background:#13131f;border:1px solid #1e1e35;border-radius:14px;padding:14px 10px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#7c9dff;">${(totalSteps / 1000).toFixed(0)}k</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px;font-weight:600;">Total steps</div>
      </div>
      <div style="background:#13131f;border:1px solid #1e1e35;border-radius:14px;padding:14px 10px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#a78bfa;">${totalParticipants}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px;font-weight:600;">Competitors</div>
      </div>
    </div>

    <!-- CTA -->
    <a href="https://lpr-step-challenge.vercel.app/dashboard"
      style="display:block;background:linear-gradient(135deg,#3b5bff,#7c3aed);border-radius:14px;padding:16px;text-align:center;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 8px 24px rgba(59,91,255,0.3);">
      Log Today's Steps →
    </a>

    <!-- Footer -->
    <p style="font-size:11px;color:#374151;text-align:center;margin-top:24px;line-height:1.5;">
      LPR Step Challenge · You're receiving this because you joined ${challengeTitle}.<br>
      <a href="https://lpr-step-challenge.vercel.app/dashboard" style="color:#3b5bff;">View leaderboard</a>
    </p>
  </div>
</body>
</html>`
}
