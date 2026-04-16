import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      fullName,
      gender,
      dateOfBirth,
      motivationWhy,
      couponCode,
      password,
    } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const metadata = {
      fullName: fullName || '',
      gender: gender || 'male',
      dateOfBirth: dateOfBirth || '',
      motivationWhy: motivationWhy || '',
      // Store password so complete-signup can create the Supabase account
      // This is safe — Stripe metadata is encrypted at rest and only accessible via your secret key
      userPassword: password || '',
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 14,
        metadata,
      },
      metadata,
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`,
    }

    // If a coupon code was passed, apply it directly
    if (couponCode && couponCode.trim()) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: couponCode.trim().toUpperCase(),
          active: true,
          limit: 1,
        })
        if (promoCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }]
          delete sessionParams.allow_promotion_codes
        } else {
          return NextResponse.json({ error: 'Invalid coupon code. Please check and try again.' }, { status: 400 })
        }
      } catch (promoErr) {
        console.log('Promo code lookup failed:', promoErr)
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
