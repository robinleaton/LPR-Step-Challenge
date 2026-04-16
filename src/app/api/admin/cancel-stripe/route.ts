import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription ID provided' }, { status: 400 })
    }

    await stripe.subscriptions.cancel(subscriptionId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    // Don't error if already cancelled
    if (err.code === 'resource_missing') {
      return NextResponse.json({ success: true, note: 'Already cancelled' })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
