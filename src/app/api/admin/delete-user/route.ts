import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(request: NextRequest) {
  try {
    const { userId, cancelStripe = true } = await request.json()

    if (!userId) return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })

    // 1. Get the user's Stripe IDs before deleting profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single()

    // 2. Cancel Stripe subscription if one exists
    if (cancelStripe && profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (stripeErr: any) {
        // Log but don't block — subscription may already be cancelled
        console.log('Stripe cancel note:', stripeErr.message)
      }
    }

    // 3. Delete challenge participations
    await supabase.from('challenge_participants').delete().eq('user_id', userId)

    // 4. Delete step logs
    await supabase.from('step_logs').delete().eq('user_id', userId)

    // 5. Delete profile
    await supabase.from('profiles').delete().eq('id', userId)

    // 6. Delete Supabase auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      stripesCancelled: !!(cancelStripe && profile?.stripe_subscription_id),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
