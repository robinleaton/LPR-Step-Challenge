import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, steps, source } = await request.json()
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (steps !== undefined && steps !== null) {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('step_logs').upsert({
        user_id: userId,
        steps: parseInt(steps),
        date: today,
        source: source || 'samsung_health',
      }, { onConflict: 'user_id,date' })
      if (error) return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
      return NextResponse.json({ success: true, steps: parseInt(steps) })
    }
    return NextResponse.json({ error: 'not_connected', message: 'Please connect Samsung Health to Health Connect first.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: 'server_error', message: err.message }, { status: 500 })
  }
}
