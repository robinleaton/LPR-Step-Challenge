'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(false)

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!slug) return
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('invite_slug', slug)
        .single()
      if (data) setChallenge(data)
      setLoading(false)
    }
    fetchChallenge()
  }, [slug])

  const handleJoin = async () => {
    setCheckingAuth(true)

    // Check if already logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Already a subscriber — enrol them directly and go to dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.is_subscribed || profile?.subscription_status === 'trial' || profile?.subscription_status === 'active') {
        // Enrol in challenge
        if (challenge) {
          const { data: existing } = await supabase
            .from('challenge_participants')
            .select('id')
            .eq('user_id', user.id)
            .eq('challenge_id', challenge.id)
            .single()

          if (!existing) {
            await supabase.from('challenge_participants').insert({
              user_id: user.id,
              challenge_id: challenge.id,
            })
            await supabase
              .from('challenges')
              .update({ current_participants: (challenge.current_participants || 0) + 1 })
              .eq('id', challenge.id)
          }
        }
        router.push('/dashboard')
        return
      }
    }

    // Not logged in or not a subscriber — send to Stripe signup
    // Pass the slug so /auth/complete can enrol them after payment
    router.push(`/auth/signup?challenge=${slug}`)
    setCheckingAuth(false)
  }

  const getPrizeAmount = () => {
    if (!challenge?.prize_pool?.length) return null
    return challenge.prize_pool[0]?.amount
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!challenge) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="text-xl font-bold dark:text-white mb-2">Challenge not found</h2>
        <p className="text-gray-400">This invite link may be invalid or expired.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black pb-10">

      {/* Hero */}
      <div className="px-4 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0d1233 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #3b5bff, #7c3aed)' }}>🏃</div>
          <span className="font-black text-lg dark:text-white">LPR Step Challenge</span>
        </div>
        <h1 className="text-2xl font-black dark:text-white leading-tight mb-2">
          You've been invited to join
        </h1>
        <h2 className="text-xl font-bold text-cobalt-400">{challenge.title}</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cobalt-500/20 text-cobalt-400 border border-cobalt-500/30">
            📅 {challenge.start_date} → {challenge.end_date}
          </span>
          {getPrizeAmount() && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              🏆 ${getPrizeAmount()} NZD prize
            </span>
          )}
        </div>
      </div>

      {/* Prize banner */}
      {getPrizeAmount() && (
        <div className="mx-4 mb-4 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #1a1040, #0d0d20)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <span className="text-4xl">🏆</span>
          <div>
            <div className="text-2xl font-black"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ${getPrizeAmount()} NZD
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Prize pool · most steps wins</div>
          </div>
        </div>
      )}

      {/* Challenge instructions */}
      {challenge.description && (
        <div className="card mx-4 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From the organiser</p>
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{challenge.description}</p>
        </div>
      )}

      {/* What you get */}
      <div className="card mx-4 mb-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">What you get</p>
        {[
          { icon: '🏆', text: 'Live leaderboard — see exactly where you rank' },
          { icon: '📸', text: 'Daily step logging — just upload a photo' },
          { icon: '🔥', text: 'Streak tracking and weekly goals' },
          { icon: '🎮', text: 'Avatar that levels up as you walk more' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-lg">{item.icon}</span>
            <p className="text-sm text-gray-400">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mx-4 mb-6 rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #0d1a0d, #13131f)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-sm font-bold text-green-400">14 days free</div>
            <div className="text-xs text-gray-400 mt-0.5">Then $15 NZD/month · cancel any time · card required</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-4">
        <button
          onClick={handleJoin}
          disabled={checkingAuth}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
        >
          {checkingAuth
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> One sec...</>
            : 'Join the Challenge — 14 days free 🚀'}
        </button>
        <p className="text-center text-xs text-gray-600 mt-3">
          Card required. $15 NZD/month after your free trial. Cancel any time.
        </p>
      </div>

    </div>
  )
}
