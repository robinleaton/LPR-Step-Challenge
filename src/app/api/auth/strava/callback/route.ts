import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/sync?error=strava_denied', request.url))
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/sync?error=strava_token', request.url))
    }

    const cookieHeader = request.headers.get('cookie') || ''
    const authRes = await supabase.auth.getUser()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    await supabase.from('profiles').update({
      strava_connected: true,
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      strava_token_expires_at: tokenData.expires_at,
      strava_athlete_id: tokenData.athlete?.id,
    }).eq('id', user.id)

    return NextResponse.redirect(new URL('/sync?connected=strava', request.url))
  } catch (err) {
    return NextResponse.redirect(new URL('/sync?error=strava_failed', request.url))
  }
}
