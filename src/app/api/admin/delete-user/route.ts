import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })

    // Delete step logs
    await supabase.from('step_logs').delete().eq('user_id', userId)

    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId)

    // Delete auth user (requires service role key — server side only)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
