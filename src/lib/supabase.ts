import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  profiles: {
    id: string
    email: string
    full_name: string | null
    gender: 'male' | 'female' | 'prefer_not_to_say' | null
    date_of_birth: string | null
    country: string
    avatar_stage: number
    total_steps: number
    is_admin: boolean
    is_subscribed: boolean
    subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    trial_ends_at: string | null
    notification_email: boolean
    notification_push: boolean
    push_subscription: any
    theme: string
    created_at: string
    updated_at: string
  }
}
