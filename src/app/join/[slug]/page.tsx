'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [joined, setJoined] = useState(false)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [whyFocused, setWhyFocused] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    gender: 'male',
    date_of_birth: '',
    country: 'New Zealand',
    motivation_why: '',
  })

  const WHY_EXAMPLES = [
    'To pay for my daughter\'s piano lessons 🎹',
    'To prove to myself I can do hard things',
    'To feel confident at my sister\'s wedding',
    'To keep up with my kids at the park',
  ]

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

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      toast.error('Please enter your email and password')
      return
    }
    setSubmitting(true)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authError) {
      toast.error('Invalid email or password')
      setSubmitting(false)
      return
    }
    // Join challenge
    await joinChallenge(authData.user.id)
    setSubmitting(false)
  }

  const handleSignUp = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error('Please fill in your name, email and password')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) {
      toast.error(authError.message)
      setSubmitting(false)
      return
    }
    if (!authData.user) {
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    // Create profile with motivation_why
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: form.email,
      full_name: form.full_name,
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
      country: form.country,
      motivation_why: form.motivation_why.trim() || null,
      is_subscribed: false,
      subscription_status: 'trial',
      total_steps: 0,
    })

    if (profileError) {
      toast.error('Could not create profile. Please try again.')
      setSubmitting(false)
      return
    }

    await joinChallenge(authData.user.id)

    // Send welcome email
    try {
      await fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.full_name,
          challengeTitle: challenge?.title,
        }),
      })
    } catch {}

    setSubmitting(false)
  }

  const joinChallenge = async (userId: string) => {
    if (!challenge) return

    // Check if already a member
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

    setJoined(true)
    toast.success('You\'re in! Welcome to the challenge 🎉')
    setTimeout(() => router.push('/dashboard'), 2000)
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

  if (joined) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">You're in! 🎉</h2>
        <p className="text-gray-400">Taking you to your dashboard...</p>
      </motion.div>
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
          <span className="text-4xl" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>🏆</span>
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

      {/* Sign in / Sign up toggle */}
      <div className="mx-4 mb-4 flex rounded-xl overflow-hidden border border-gray-700">
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            mode === 'signup'
              ? 'bg-cobalt-500 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          New account
        </button>
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            mode === 'signin'
              ? 'bg-cobalt-500 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          I have an account
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SIGN UP FORM ── */}
        {mode === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {/* Basic fields */}
            <div className="card mx-4 mb-3 space-y-3">
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="John Doe"
                  value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="john@email.com"
                  value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={form.password} onChange={e => handleChange('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female'].map(g => (
                    <button key={g} onClick={() => handleChange('gender', g)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        form.gender === g
                          ? 'bg-cobalt-500/20 border-cobalt-500 text-cobalt-400'
                          : 'border-gray-700 text-gray-500'
                      }`}>
                      {g === 'male' ? '👨 Male' : '👩 Female'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date"
                  value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} />
              </div>
            </div>

            {/* ── THE WHY FIELD ── */}
            <div className="mx-4 mb-4 rounded-2xl p-4"
              style={{
                background: whyFocused
                  ? 'linear-gradient(135deg, #0b1430, #13131f)'
                  : 'linear-gradient(135deg, #0d0d1a, #111120)',
                border: whyFocused ? '1px solid rgba(59,91,255,0.4)' : '1px solid rgba(59,91,255,0.2)',
                transition: 'all 0.2s',
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💬</span>
                <span className="text-sm font-bold dark:text-white">Why do you want to win?</span>
                <span className="text-xs text-gray-600 ml-auto">optional</span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                This stays private. We'll use it to personalise your weekly motivation reminders.
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. So I can keep up with my kids at the park..."
                value={form.motivation_why}
                onFocus={() => setWhyFocused(true)}
                onBlur={() => setWhyFocused(false)}
                onChange={e => handleChange('motivation_why', e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5' }}
              />
              {form.motivation_why.length > 4 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <span className="text-xs" style={{ color: '#7c9dff' }}>✨ Your weekly reminders will be personalised around this</span>
                </motion.div>
              )}
              {/* Example prompts — only show when empty */}
              {!form.motivation_why && (
                <div className="flex flex-col gap-1.5 mt-3">
                  {WHY_EXAMPLES.map((ex, i) => (
                    <button key={i}
                      onClick={() => handleChange('motivation_why', ex)}
                      className="text-left text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-800 bg-white/5 hover:border-cobalt-500/50 hover:text-gray-400 transition-all leading-relaxed">
                      💡 "{ex}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-4">
              <button
                onClick={handleSignUp}
                disabled={submitting}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                  : 'Join Challenge 🚀'}
              </button>
              <p className="text-center text-xs text-gray-600 mt-3">
                By joining you agree to our terms. $15/month after trial.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── SIGN IN FORM ── */}
        {mode === 'signin' && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="card mx-4 mb-4 space-y-3">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="you@email.com"
                  value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Your password"
                    value={form.password} onChange={e => handleChange('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mx-4">
              <button
                onClick={handleSignIn}
                disabled={submitting}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                  : 'Sign In & Join Challenge →'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
