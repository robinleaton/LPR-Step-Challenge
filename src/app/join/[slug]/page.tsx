'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
const formatDate = (date: string, time: string) => {
  const d = new Date(`${date}T${time}`)
  return d.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const COUNTRY_FLAGS: Record<string, string> = {
  'New Zealand': '🇳🇿', 'Australia': '🇦🇺', 'United Kingdom': '🇬🇧',
  'United States': '🇺🇸', 'Rarotonga': '🇨🇰', 'Niue': '🇳🇺',
  'Samoa': '🇼🇸', 'Tonga': '🇹🇴', 'Fiji': '🇫🇯'
}

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', country: '', agreeSteps: false, agreeFeedback: false })

  useEffect(() => {
    const fetchChallenge = async () => {
      const { data } = await supabase.from('challenges').select('*').eq('invite_slug', slug).single()
      if (data) setChallenge(data)
      setLoading(false)
    }
    fetchChallenge()
  }, [slug])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agreeSteps || !form.agreeFeedback) { toast.error('Please agree to both checkboxes'); return }
    if (!form.country) { toast.error('Please select your country'); return }
    if ((challenge.current_participants || 0) >= challenge.participant_limit) { toast.error('This challenge is full'); return }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } }
      })
      if (error) { toast.error(error.message); setSubmitting(false); return }
      if (data.user) {
        await supabase.from('profiles').update({
          full_name: form.fullName,
          country: form.country,
          subscription_status: 'active',
          is_subscribed: true,
        }).eq('id', data.user.id)
        await supabase.from('challenge_participants').insert({ challenge_id: challenge.id, user_id: data.user.id })
        await supabase.from('challenges').update({ current_participants: (challenge.current_participants || 0) + 1 }).eq('id', challenge.id)
        toast.success('Welcome to the challenge! 🎉')
        router.push('/dashboard')
      }
    } catch { toast.error('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!challenge) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="text-center space-y-4">
        <p className="text-4xl">😕</p>
        <h1 className="text-xl font-bold dark:text-white">Challenge not found</h1>
        <p className="text-gray-400">This invite link is invalid or has expired.</p>
      </div>
    </div>
  )

  const isFull = (challenge.current_participants || 0) >= challenge.participant_limit
  const spotsLeft = challenge.participant_limit - (challenge.current_participants || 0)

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-cobalt-500 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">LPR</span>
          </div>
          <h1 className="text-2xl font-bold dark:text-white">{challenge.title}</h1>
        </motion.div>

        {/* Challenge details */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Starts</p>
              <p className="font-medium dark:text-white text-xs">{formatDate(challenge.start_date, challenge.start_time || '00:00')}</p>
            </div>  
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">  
              <p className="text-gray-400 text-xs">Ends</p>
              <p className="font-medium dark:text-white text-xs">{formatDate(challenge.end_date, challenge.end_time || '23:59')}</p>
            </div>
            {challenge.prize_pool?.[0] && (
              <div className="bg-amber-500/10 rounded-xl p-3">
                <p className="text-gray-400 text-xs">Prize 🏆</p>
                <p className="font-bold text-amber-500 text-lg">${challenge.prize_pool[0].amount} NZD</p>
              </div>
            )}
            <div className={`rounded-xl p-3 ${isFull ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <p className="text-gray-400 text-xs">Spots</p>
              <p className={`font-bold text-lg ${isFull ? 'text-red-400' : 'text-green-500'}`}>{isFull ? 'Full!' : `${spotsLeft} left`}</p>
              <p className="text-xs text-gray-400">{challenge.current_participants || 0}/{challenge.participant_limit} joined</p>
            </div>
          </div>
          {challenge.allowed_countries?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Open to</p>
              <div className="flex flex-wrap gap-2">
                {challenge.allowed_countries.map((c: string) => (
                  <span key={c} className="text-xs bg-cobalt-500/10 text-cobalt-400 px-2 py-1 rounded-full">{COUNTRY_FLAGS[c] || '🌏'} {c}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* How it Works */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card space-y-4">
          <h2 className="font-bold dark:text-white text-lg">👟 How it Works — It's Easy!</h2>
          <div className="space-y-3">
            {[
              { step: '1', emoji: '🚶', title: 'Walk!', desc: 'Go for a walk, run, or any activity that counts steps. Every step counts towards your total!' },
              { step: '2', emoji: '📱', title: 'Check your steps', desc: 'At the end of each day, open your fitness app (Samsung Health, Apple Health, Fitbit, etc.) and take a screenshot of your step count for today.' },
              { step: '3', emoji: '📸', title: 'Submit before 11:59pm', desc: 'Open this app, tap "Submit Today\'s Steps", upload your screenshot and confirm your steps. That\'s it!' },
              { step: '4', emoji: '🏆', title: 'Watch the leaderboard', desc: 'See how you\'re tracking against everyone else in real time. The person with the most steps at the end wins!' },
            ].map(item => (
              <div key={item.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cobalt-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{item.step}</span>
                </div>
                <div>
                  <p className="font-medium dark:text-white">{item.emoji} {item.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-sm text-red-400 font-medium">⚠️ Important Rule</p>
            <p className="text-sm text-gray-400 mt-1">Steps <strong className="text-gray-300">must be submitted before 11:59pm on the same day</strong>. You cannot go back and add steps for a previous day, so don't forget!</p>
          </div>
        </motion.div>

        {/* Custom instructions from admin */}
        {challenge.description && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card space-y-2">
            <h2 className="font-bold dark:text-white">📋 From the organiser</h2>
            <p className="text-sm text-gray-400 whitespace-pre-line">{challenge.description}</p>
          </motion.div>
        )}

        {/* Signup form or full message */}
        {isFull ? (
          <div className="card text-center py-8 space-y-2">
            <p className="text-4xl">😔</p>
            <h2 className="font-bold dark:text-white">Challenge is Full</h2>
            <p className="text-gray-400 text-sm">All {challenge.participant_limit} spots have been taken.</p>
          </div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onSubmit={handleJoin} className="card space-y-4">
            <h2 className="font-bold dark:text-white text-lg">✍️ Sign Up to Join</h2>
            <div><label className="label">Full Name</label><input required className="input" placeholder="e.g. Robin Leaton" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
            <div><label className="label">Email Address</label><input required type="email" className="input" placeholder="e.g. robin@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><label className="label">Choose a Password</label><input required type="password" className="input" placeholder="At least 6 characters" minLength={6} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            <div>
              <label className="label">Your Country</label>
              <select required className="input" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
                <option value="">Select your country...</option>
                {(challenge.allowed_countries || []).map((c: string) => (
                  <option key={c} value={c}>{COUNTRY_FLAGS[c] || '🌏'} {c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreeSteps} onChange={e => setForm(p => ({ ...p, agreeSteps: e.target.checked }))} className="mt-1 accent-cobalt-500 shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">I understand that steps must be submitted before <strong className="text-white">11:59pm on the same day</strong>. I cannot go back and add steps for previous days.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreeFeedback} onChange={e => setForm(p => ({ ...p, agreeFeedback: e.target.checked }))} className="mt-1 accent-cobalt-500 shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">I'm happy to answer a short <strong className="text-white">feedback survey</strong> at the end of the challenge to help make future challenges even better.</span>
              </label>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Joining...</>
              ) : (
                '🏃 Join the Challenge!'
              )}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  )
}
