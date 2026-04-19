'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const WHY_EXAMPLES = [
  'To keep up with my kids at the park',
  'To prove to myself I can do hard things',
  'To feel confident and energised every day',
  'To win the prize and treat my family 🏆',
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const challengeSlug = searchParams.get('challenge') || ''

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [whyFocused, setWhyFocused] = useState(false)
  const [showCoupon, setShowCoupon] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: 'male',
    dateOfBirth: '',
    motivationWhy: '',
    couponCode: '',
  })

  const set = (field: string, value: string) =>
    setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in your name, email and password')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          motivationWhy: form.motivationWhy.trim(),
          couponCode: form.couponCode.trim(),
          password: form.password,
          challengeSlug, // pass through so /auth/complete can enrol them
        }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black pb-10">

      {/* Header */}
      <div className="px-4 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0d1233 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #3b5bff, #7c3aed)' }}>🏃</div>
          <span className="font-black text-lg dark:text-white">LPR Step Challenge</span>
        </div>
        <h1 className="text-2xl font-black dark:text-white leading-tight mb-1">
          Create your account
        </h1>
        <p className="text-sm text-gray-400">14-day free trial · then $15 NZD/month · cancel anytime</p>
      </div>

      {/* Trial banner */}
      <div className="mx-4 mb-4 rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #0d1a0d, #13131f)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <span className="text-2xl">🎁</span>
        <div>
          <div className="text-sm font-bold text-green-400">14 days free</div>
          <div className="text-xs text-gray-400 mt-0.5">Card required · auto-charges after trial · cancel any time</div>
        </div>
      </div>

      {/* Basic fields */}
      <div className="card mx-4 mb-3 space-y-3">
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="John Doe"
            value={form.fullName} onChange={e => set('fullName', e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="john@email.com"
            value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input className="input pr-10" type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)} />
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
              <button key={g} onClick={() => set('gender', g)}
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
            value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
        </div>
      </div>

      {/* Why field */}
      <div className="mx-4 mb-3 rounded-2xl p-4 transition-all"
        style={{
          background: whyFocused ? 'linear-gradient(135deg, #0b1430, #13131f)' : 'linear-gradient(135deg, #0d0d1a, #111120)',
          border: whyFocused ? '1px solid rgba(59,91,255,0.4)' : '1px solid rgba(59,91,255,0.2)',
          transition: 'all 0.2s',
        }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">💬</span>
          <span className="text-sm font-bold dark:text-white">Why do you want to join?</span>
          <span className="text-xs text-gray-600 ml-auto">optional</span>
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Stays private. We'll use it to personalise your weekly motivation reminders.
        </p>
        <textarea
          className="input"
          rows={2}
          placeholder="e.g. To keep up with my kids at the park..."
          value={form.motivationWhy}
          onFocus={() => setWhyFocused(true)}
          onBlur={() => setWhyFocused(false)}
          onChange={e => set('motivationWhy', e.target.value)}
          style={{ resize: 'none', lineHeight: '1.5' }}
        />
        {form.motivationWhy.length > 4 && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-2" style={{ color: '#7c9dff' }}>
            ✨ Your weekly reminders will be personalised around this
          </motion.p>
        )}
        {!form.motivationWhy && (
          <div className="flex flex-col gap-1.5 mt-3">
            {WHY_EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => set('motivationWhy', ex)}
                className="text-left text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-800 bg-white/5 hover:border-cobalt-500/50 hover:text-gray-400 transition-all leading-relaxed">
                💡 "{ex}"
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coupon code */}
      <div className="mx-4 mb-4">
        <button onClick={() => setShowCoupon(!showCoupon)}
          className="flex items-center gap-2 text-xs text-cobalt-400 font-semibold">
          <Tag className="w-3.5 h-3.5" />
          {showCoupon ? 'Hide coupon code' : 'Have a coupon code?'}
        </button>
        {showCoupon && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
            <input className="input" placeholder="e.g. BUDS4WEEKS"
              value={form.couponCode}
              onChange={e => set('couponCode', e.target.value.toUpperCase())}
              style={{ letterSpacing: '0.05em' }} />
            <p className="text-xs text-gray-500 mt-1.5">Valid codes extend your free trial. Card still required.</p>
          </motion.div>
        )}
      </div>

      {/* CTA */}
      <div className="mx-4 space-y-3">
        <button onClick={handleSubmit} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up...</>
            : 'Continue to Payment 🔒'}
        </button>
        <p className="text-center text-xs text-gray-600">
          By signing up you agree to our terms. $15 NZD/month after your free trial.
        </p>
        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-cobalt-400 hover:text-cobalt-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-lpr-black"><div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
