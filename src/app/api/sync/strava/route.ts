import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('id', userId)
      .single()

    if (!profile?.strava_access_token) {
      return NextResponse.json({ error: 'not_connected', message: 'Strava not connected' }, { status: 400 })
    }

    let accessToken = profile.strava_access_token
    const now = Math.floor(Date.now() / 1000)

    if (profile.strava_token_expires_at < now) {
      const refreshed = await refreshStravaToken(profile.strava_refresh_token)
      if (!refreshed.access_token) {
        return NextResponse.json({ error: 'token_refresh_failed' }, { status: 400 })
      }
      accessToken = refreshed.access_token
      await supabase.from('profiles').update({
        strava_access_token: refreshed.access_token,
        strava_refresh_token: refreshed.refresh_token,
        strava_token_expires_at: refreshed.expires_at,
      }).eq('id', userId)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const after = Math.floor(today.getTime() / 1000)

    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const activities = await activitiesRes.json()

    if (!Array.isArray(activities)) {
      return NextResponse.json({ error: 'strava_error', message: 'Could not fetch activities' }, { status: 400 })
    }

    // Count steps from walking/running activities (Strava uses distance, we convert)
    // For walking: ~1300 steps per km, running: ~1500 steps per km
    let totalSteps = 0
    for (const activity of activities) {
      const type = activity.type?.toLowerCase()
      if (['walk', 'run', 'hike', 'virtualrun', 'trailrun'].includes(type)) {
        const km = (activity.distance || 0) / 1000
        const stepsPerKm = type === 'walk' || type === 'hike' ? 1300 : 1500
        totalSteps += Math.round(km * stepsPerKm)
      }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('step_logs').upsert({
      user_id: userId,
      steps: totalSteps,
      date: todayStr,
      source: 'strava',
    }, { onConflict: 'user_id,date' })

    if (error) return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, steps: totalSteps })
  } catch (err: any) {
    return NextResponse.json({ error: 'server_error', message: err.message }, { status: 500 })
  }
}
