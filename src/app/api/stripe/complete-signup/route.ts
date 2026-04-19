import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const email = session.customer_email
      || (session.customer as Stripe.Customer)?.email
    if (!email) {
      return NextResponse.json({ error: 'No email found in session' }, { status: 400 })
    }

    const metadata = session.metadata || {}
    const fullName = metadata.fullName || ''
    const gender = metadata.gender || 'male'
    const dateOfBirth = metadata.dateOfBirth || null
    const motivationWhy = metadata.motivationWhy || null
    const userPassword = metadata.userPassword || ''
    const challengeSlug = metadata.challengeSlug || ''

    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer)?.id

    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id

    // Check if user already exists
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.find((u: any) => u.email === email)

    let userId: string
    let passwordToReturn: string

    if (existingUser) {
      userId = existingUser.id
      passwordToReturn = userPassword
    } else {
      passwordToReturn = userPassword || (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8))

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: passwordToReturn,
        email_confirm: true,
      })

      if (createError || !newUser.user) {
        console.error('Create user error:', createError)
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
      }

      userId = newUser.user.id
    }

    const sub = session.subscription as Stripe.Subscription
    const stripeStatus = sub?.status || 'trialing'
    const subscriptionStatus = stripeStatus === 'trialing' ? 'trial'
      : stripeStatus === 'active' ? 'active'
      : 'trial'

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      gender,
      date_of_birth: dateOfBirth,
      motivation_why: motivationWhy,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: subscriptionStatus,
      is_subscribed: true,
      total_steps: 0,
    }, { onConflict: 'id' })

    // ── Auto-enrol in challenge if slug was passed ────────────────────────
    if (challengeSlug) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('id, current_participants')
        .eq('invite_slug', challengeSlug)
        .single()

      if (challenge) {
        const { data: existing } = await supabase
          .from('challenge_participants')
          .select('id')
          .eq('user_id', userId)
          .eq('challenge_id', challenge.id)
          .single()

        if (!existing) {
          await supabase.from('challenge_participants').insert({
            user_id: userId,
            challenge_id: challenge.id,
          })
          await supabase
            .from('challenges')
            .update({ current_participants: (challenge.current_participants || 0) + 1 })
            .eq('id', challenge.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      email,
      password: passwordToReturn,
      userId,
    })

  } catch (err: any) {
    console.error('Complete signup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
