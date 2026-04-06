import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, gender, dateOfBirth, notificationEmail, notificationPush } = await req.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          fullName,
          gender,
          dateOfBirth,
          notificationEmail: String(notificationEmail),
          notificationPush: String(notificationPush),
        },
      },
      metadata: {
        fullName,
        gender,
        dateOfBirth,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
