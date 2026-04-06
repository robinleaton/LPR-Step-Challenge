'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { MaleAvatar } from '@/components/avatar/MaleAvatar'
import { FemaleAvatar } from '@/components/avatar/FemaleAvatar'
import { Eye, EyeOff, Mail, Lock, User, Calendar, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: details, 2: payment
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: '',
    dateOfBirth: '',
    notificationEmail: true,
    notificationPush: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.gender) { toast.error('Please select your gender'); return }
    if (!form.dateOfBirth) { toast.error('Please enter your date of birth'); return }
    setStep(2)
  }

  const handleSignup = async () => {
    setLoading(true)
    try {
      // 1. Create Stripe checkout session for trial
      const stripeRes = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          notificationEmail: form.notificationEmail,
          notificationPush: form.notificationPush,
        }),
      })
      const { url } = await stripeRes.json()
      if (url) {
        // Store signup data in sessionStorage temporarily
        sessionStorage.setItem('pendingSignup', JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          notificationEmail: form.notificationEmail,
          notificationPush: form.notificationPush,
        }))
        window.location.href = url
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white dark:bg-lpr-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <AnimatePresence mode="wait">
            {form.gender === 'female' ? (
              <motion.div key="female" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <FemaleAvatar stage={1} size={100} animated />
              </motion.div>
            ) : (
              <motion.div key="male" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <MaleAvatar stage={1} size={100} animated />
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Join the Challenge</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">14 days free • Then $15 NZD/month</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-2 rounded-full transition-all ${step >= 1 ? 'bg-cobalt-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div className={`w-8 h-2 rounded-full transition-all ${step >= 2 ? 'bg-cobalt-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          </div>
        </div>

        <div className="card">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="font-bold dark:text-white">Your Details</h2>
              
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                    placeholder="Jane Smith" className="input pl-10" required />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="your@email.com" className="input pl-10" required />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={handleChange} placeholder="Min 8 characters" className="input pl-10 pr-10"
                    required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'male', label: '👨 Male' },
                    { value: 'female', label: '👩 Female' },
                    { value: 'prefer_not_to_say', label: '🙂 Prefer not' },
                  ].map(g => (
                    <button key={g.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, gender: g.value }))}
                      className={`p-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.gender === g.value
                          ? 'border-cobalt-500 bg-cobalt-500/10 text-cobalt-500'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}
                    className="input pl-10" required max={new Date().toISOString().split('T')[0]} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for age-bracket prize categories</p>
              </div>

              {/* Notification preferences */}
              <div>
                <label className="label">Notifications</label>
                <div className="space-y-2">
                  {[
                    { key: 'notificationEmail', label: '📧 Email reminders' },
                    { key: 'notificationPush', label: '📱 Push notifications' },
                  ].map(n => (
                    <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={form[n.key as keyof typeof form] as boolean}
                        onChange={e => setForm(prev => ({ ...prev, [n.key]: e.target.checked }))}
                        className="w-4 h-4 accent-cobalt-500" />
                      <span className="text-sm dark:text-gray-300">{n.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue to Payment →
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-sm text-cobalt-500 hover:text-cobalt-400">
                ← Back
              </button>
              <h2 className="font-bold dark:text-white">Start Your Free Trial</h2>
              
              <div className="bg-cobalt-500/10 border border-cobalt-500/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">LPR Step Challenge — Monthly</span>
                  <span className="font-bold text-cobalt-500">$15 NZD/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">14-day free trial</span>
                  <span className="text-green-500 font-medium">$0 today</span>
                </div>
                <div className="border-t border-cobalt-500/20 pt-2 text-xs text-gray-400">
                  Card required to start trial. You won't be charged for 14 days. Cancel anytime.
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CreditCard className="w-4 h-4" />
                <span>You'll be taken to Stripe's secure checkout to enter your card details</span>
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Setting up...' : '🔒 Start Free Trial'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Secured by Stripe. LPR never sees your card details.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-cobalt-500 hover:text-cobalt-400 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
