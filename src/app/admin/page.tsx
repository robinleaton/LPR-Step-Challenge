'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, ArrowLeft, AlertTriangle, Mail, XCircle, Copy, Check, Pencil, Users, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'

const COUNTRIES = ['New Zealand','Australia','United Kingdom','United States','Rarotonga','Niue','Samoa','Tonga','Fiji']

const DEFAULT_INSTRUCTIONS = `Welcome to the challenge! 🏃‍♂️

This is a friendly competition to see who can walk the most steps. The person with the most total steps at the end wins the prize!

For family overseas — no worries at all, the prize will be transferred to you if you win.

Any questions? Message Robin directly. Good luck everyone — may the best walker win! 🏆`

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview'|'subscribers'|'leaderboard'|'challenges'|'sponsors'|'feedback'>('overview')
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, revenue: 0 })
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [stepLogs, setStepLogs] = useState<any[]>([])
  const [challengeLogs, setChallengeLogs] = useState<any[]>([])
  const [activeChallenge, setActiveChallenge] = useState<any>(null)
  const [todayLoggedIds, setTodayLoggedIds] = useState<Set<string>>(new Set())
  const [challenges, setChallenges] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<any>(null)
  const [editingSteps, setEditingSteps] = useState<string | null>(null)
  const [editStepValue, setEditStepValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [challengeParticipants, setChallengeParticipants] = useState<Record<string, any[]>>({})
  const [confirmRemoveParticipant, setConfirmRemoveParticipant] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editSlugValue, setEditSlugValue] = useState('')
  const [enrolCount, setEnrolCount] = useState(0)
  const [confirmDeleteChallenge, setConfirmDeleteChallenge] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; name: string; steps: number; date: string } | null>(null)
  const [challengeForm, setChallengeForm] = useState({
    title: '', start_date: '', start_time: '06:00', end_date: '', end_time: '23:59',
    prize_amount: '', participant_limit: '30', invite_only: true, auto_enrol_subscribers: false,
    allowed_countries: ['New Zealand'] as string[], custom_instructions: DEFAULT_INSTRUCTIONS,
  })
  const [sponsorForm, setSponsorForm] = useState({ name: '', logo_url: '', link: '', tagline: '', is_active: true })
  const [showSponsorForm, setShowSponsorForm] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      fetchAll()
    }
    init()
  }, [router])

  const fetchAll = async () => {
    const { data: subs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (subs) {
      setSubscribers(subs)
      const activeSubs = subs.filter(s => s.subscription_status === 'active' || s.subscription_status === 'trial')
      setEnrolCount(activeSubs.length)
      setStats({
        total: subs.length,
        active: subs.filter(s => s.subscription_status === 'active').length,
        trial: subs.filter(s => s.subscription_status === 'trial').length,
        revenue: subs.filter(s => s.subscription_status === 'active').length * 15,
      })
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

    // Today's logs for green/red indicators
    const { data: todayLogs } = await supabase
      .from('step_logs')
      .select('*, profiles(full_name, email, subscription_status)')
      .eq('date', today)
      .order('steps', { ascending: false })
    if (todayLogs) {
      setStepLogs(todayLogs)
      setTodayLoggedIds(new Set(todayLogs.map((l: any) => l.user_id)))
    }

    // Find active challenge and fetch all logs within it
    const { data: ch } = await supabase.from('challenges').select('*').order('created_at', { ascending: false })
    if (ch) {
      setChallenges(ch)
      const active = ch.find((c: any) => today >= c.start_date && today <= c.end_date && c.is_active)
      setActiveChallenge(active || null)

      if (active) {
        // Get all step logs within the active challenge window
        const { data: allLogs } = await supabase
          .from('step_logs')
          .select('user_id, steps, date, photo_url, source, profiles(full_name, email)')
          .gte('date', active.start_date)
          .lte('date', active.end_date)
          .order('date', { ascending: false })

        if (allLogs) {
          // Aggregate total steps per user
          const totals: Record<string, { name: string; email: string; steps: number; lastPhoto: string | null; lastDate: string; logs: any[] }> = {}
          allLogs.forEach((log: any) => {
            if (!totals[log.user_id]) {
              totals[log.user_id] = {
                name: log.profiles?.full_name || log.profiles?.email || 'Unknown',
                email: log.profiles?.email || '',
                steps: 0,
                lastPhoto: null,
                lastDate: '',
                logs: [],
              }
            }
            totals[log.user_id].steps += log.steps
            totals[log.user_id].logs.push(log)
            if (log.photo_url && (!totals[log.user_id].lastDate || log.date > totals[log.user_id].lastDate)) {
              totals[log.user_id].lastPhoto = log.photo_url
              totals[log.user_id].lastDate = log.date
            }
          })
          const sorted = Object.entries(totals)
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a, b) => b.steps - a.steps)
          setChallengeLogs(sorted)
        }
      }

      const { data: allParticipants } = await supabase
        .from('challenge_participants')
        .select('*, profiles(id, full_name, email, country)')
      if (allParticipants) {
        const grouped: Record<string, any[]> = {}
        allParticipants.forEach(p => {
          if (!grouped[p.challenge_id]) grouped[p.challenge_id] = []
          grouped[p.challenge_id].push(p)
        })
        setChallengeParticipants(grouped)
      }
    }

    const { data: sp } = await supabase.from('sponsors').select('*').order('display_order')
    if (sp) setSponsors(sp)
    const { data: fb } = await supabase.from('challenge_feedback').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
    if (fb) setFeedback(fb)
    setLoading(false)
  }

  const exportEmails = () => {
    const csv = ['Name,Email,Status,Total Steps,Joined',
      ...subscribers.map(s => [s.full_name||'', s.email, s.subscription_status, s.total_steps||0, new Date(s.created_at).toLocaleDateString('en-NZ')].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lpr-subscribers.csv'; a.click()
    toast.success('CSV exported!')
  }

  const cancelSubscription = async (userId: string) => {
    const sub = subscribers.find(s => s.id === userId)
    if (sub?.stripe_subscription_id) {
      try {
        await fetch('/api/admin/cancel-stripe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: sub.stripe_subscription_id }),
        })
      } catch {}
    }
    const { error } = await supabase.from('profiles').update({ subscription_status: 'cancelled', is_subscribed: false }).eq('id', userId)
    if (!error) { toast.success('Subscription cancelled — Stripe payments stopped'); setConfirmCancel(null); fetchAll() }
    else toast.error('Failed to cancel')
  }

  const deleteAccount = async (userId: string) => {
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cancelStripe: true }),
    })
    const data = await response.json()
    if (data.success) {
      const stripeMsg = data.stripesCancelled ? ' · Stripe subscription cancelled' : ''
      toast.success(`Account deleted${stripeMsg}`); setConfirmDelete(null); fetchAll()
    } else toast.error(data.error || 'Failed to delete')
  }

  const overrideSteps = async (userId: string) => {
    const steps = parseInt(editStepValue)
    if (isNaN(steps)) { toast.error('Invalid steps'); return }
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
    const { error } = await supabase.from('step_logs').upsert({ user_id: userId, steps, date: today, source: 'admin_override' }, { onConflict: 'user_id,date' })
    if (!error) { toast.success('Steps updated!'); setEditingSteps(null); fetchAll() }
    else toast.error('Failed to update steps')
  }

  const deleteStepLog = async (userId: string) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
    await supabase.from('step_logs').delete().eq('user_id', userId).eq('date', today)
    toast.success('Step log removed'); fetchAll()
  }

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 6)

  const createChallenge = async () => {
    if (!challengeForm.title || !challengeForm.start_date || !challengeForm.end_date) { toast.error('Please fill in title, start date and end date'); return }
    const slug = generateSlug(challengeForm.title)
    const { data: newChallenge, error } = await supabase.from('challenges').insert({
      title: challengeForm.title, description: challengeForm.custom_instructions,
      start_date: challengeForm.start_date, start_time: challengeForm.start_time,
      end_date: challengeForm.end_date, end_time: challengeForm.end_time,
      prize_pool: challengeForm.prize_amount ? [{ place: 1, amount: parseFloat(challengeForm.prize_amount), description: '1st place prize' }] : [],
      participant_limit: parseInt(challengeForm.participant_limit), invite_only: challengeForm.invite_only,
      allowed_countries: challengeForm.allowed_countries, invite_slug: slug, is_active: true, current_participants: 0,
    }).select().single()
    if (error) { toast.error(error.message); return }
    if (challengeForm.auto_enrol_subscribers && newChallenge) {
      const activeSubs = subscribers.filter(s => s.subscription_status === 'active' || s.subscription_status === 'trial')
      if (activeSubs.length > 0) {
        const enrollments = activeSubs.map(s => ({ user_id: s.id, challenge_id: newChallenge.id }))
        const { error: enrollError } = await supabase.from('challenge_participants').upsert(enrollments, { onConflict: 'user_id,challenge_id', ignoreDuplicates: true })
        if (!enrollError) {
          await supabase.from('challenges').update({ current_participants: activeSubs.length }).eq('id', newChallenge.id)
          toast.success(`✅ Challenge created + ${activeSubs.length} subscribers auto-enrolled!`)
        } else toast.success('Challenge created! (Auto-enrol had an issue)')
      } else toast.success('Challenge created! No active subscribers to enrol.')
    } else toast.success('Challenge created!')
    setShowChallengeForm(false); fetchAll()
  }

  const enrolAllSubscribers = async (challengeId: string) => {
    const activeSubs = subscribers.filter(s => s.subscription_status === 'active' || s.subscription_status === 'trial')
    if (activeSubs.length === 0) { toast.error('No active subscribers to enrol'); return }
    const enrollments = activeSubs.map(s => ({ user_id: s.id, challenge_id: challengeId }))
    const { error } = await supabase.from('challenge_participants').upsert(enrollments, { onConflict: 'user_id,challenge_id', ignoreDuplicates: true })
    if (!error) {
      const newCount = Math.max((challengeParticipants[challengeId] || []).length, activeSubs.length)
      await supabase.from('challenges').update({ current_participants: newCount }).eq('id', challengeId)
      toast.success(`✅ ${activeSubs.length} subscribers enrolled!`); fetchAll()
    } else toast.error('Enrol failed: ' + error.message)
  }

  const deleteChallenge = async (challengeId: string) => {
    await supabase.from('challenge_participants').delete().eq('challenge_id', challengeId)
    const { error } = await supabase.from('challenges').delete().eq('id', challengeId)
    if (!error) { toast.success('Challenge deleted'); setConfirmDeleteChallenge(null); fetchAll() }
    else toast.error('Failed to delete challenge')
  }

  const startEditChallenge = (ch: any) => setEditingChallenge({ ...ch, prize_amount: ch.prize_pool?.[0]?.amount?.toString() || '', custom_instructions: ch.description || '' })

  const saveEditChallenge = async () => {
    if (!editingChallenge) return
    const { error } = await supabase.from('challenges').update({
      title: editingChallenge.title, description: editingChallenge.custom_instructions,
      start_date: editingChallenge.start_date, start_time: editingChallenge.start_time,
      end_date: editingChallenge.end_date, end_time: editingChallenge.end_time,
      prize_pool: editingChallenge.prize_amount ? [{ place: 1, amount: parseFloat(editingChallenge.prize_amount), description: '1st place prize' }] : [],
      participant_limit: parseInt(editingChallenge.participant_limit), allowed_countries: editingChallenge.allowed_countries,
      invite_only: editingChallenge.invite_only, is_active: editingChallenge.is_active,
    }).eq('id', editingChallenge.id)
    if (!error) { toast.success('Challenge updated!'); setEditingChallenge(null); fetchAll() }
    else toast.error(error.message)
  }

  const toggleEditCountry = (country: string) => setEditingChallenge((prev: any) => ({
    ...prev, allowed_countries: prev.allowed_countries.includes(country)
      ? prev.allowed_countries.filter((c: string) => c !== country)
      : [...prev.allowed_countries, country]
  }))

  const updateSlug = async (challengeId: string) => {
    const clean = editSlugValue.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const { error } = await supabase.from('challenges').update({ invite_slug: clean }).eq('id', challengeId)
    if (!error) { toast.success('Link updated!'); setEditingSlug(null); fetchAll() }
    else toast.error('That link is already taken — try another')
  }

  const removeParticipant = async (participantId: string, challengeId: string) => {
    const { error } = await supabase.from('challenge_participants').delete().eq('id', participantId)
    if (!error) {
      const challenge = challenges.find(c => c.id === challengeId)
      if (challenge) await supabase.from('challenges').update({ current_participants: Math.max(0, (challenge.current_participants || 1) - 1) }).eq('id', challengeId)
      toast.success('Participant removed'); setConfirmRemoveParticipant(null); fetchAll()
    } else toast.error('Failed to remove participant')
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/join/${slug}`
    navigator.clipboard.writeText(url); setCopiedSlug(slug); toast.success('Link copied!')
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const saveSponsor = async () => {
    const { error } = await supabase.from('sponsors').insert(sponsorForm)
    if (!error) { toast.success('Sponsor saved!'); setShowSponsorForm(false); fetchAll() }
    else toast.error(error.message)
  }

  const toggleCountry = (country: string) => setChallengeForm(p => ({
    ...p, allowed_countries: p.allowed_countries.includes(country)
      ? p.allowed_countries.filter(c => c !== country) : [...p.allowed_countries, country]
  }))

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'text-green-500 bg-green-500/10'
    if (status === 'trial') return 'text-amber-500 bg-amber-500/10'
    if (status === 'cancelled') return 'text-red-400 bg-red-400/10'
    return 'text-gray-400 bg-gray-400/10'
  }

  const priceSummary = feedback.reduce((acc: any, f) => {
    if (f.price_willing_to_pay) acc[f.price_willing_to_pay] = (acc[f.price_willing_to_pay] || 0) + 1
    return acc
  }, {})

  const getRankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black"><div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-lpr-black">

      {/* Photo lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{lightboxPhoto.name}</p>
                  <p className="text-sm text-gray-400">{lightboxPhoto.steps.toLocaleString()} steps · {lightboxPhoto.date}</p>
                </div>
                <button onClick={() => setLightboxPhoto(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img src={lightboxPhoto.url} alt="Step proof" className="w-full rounded-2xl object-contain max-h-[70vh]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white dark:bg-lpr-card border-b border-gray-200 dark:border-lpr-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><ArrowLeft className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full bg-cobalt-500 flex items-center justify-center"><span className="text-white text-xs font-bold">LPR</span></div>
            <h1 className="font-bold dark:text-white">Admin Dashboard</h1>
          </div>
          <span className="text-xs bg-cobalt-500/20 text-cobalt-400 px-2 py-1 rounded-full">Robin — Admin</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'subscribers', label: '👥 Subscribers' },
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'challenges', label: '⚡ Challenges' },
            { id: 'sponsors', label: '🤝 Sponsors' },
            { id: 'feedback', label: '💬 Feedback' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-cobalt-500 text-white' : 'bg-white dark:bg-lpr-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-lpr-border'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.total, color: 'text-cobalt-500' },
                { label: 'Active Subs', value: stats.active, color: 'text-green-500' },
                { label: 'On Trial', value: stats.trial, color: 'text-amber-500' },
                { label: 'Monthly Revenue', value: `$${stats.revenue} NZD`, color: 'text-cobalt-500' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card text-center space-y-2">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="card space-y-3">
              <h2 className="font-bold dark:text-white">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={exportEmails} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Mail className="w-4 h-4" /> Export Email List</button>
                <button onClick={() => setActiveTab('leaderboard')} className="btn-secondary text-sm px-4 py-2">🏆 Leaderboard</button>
                <button onClick={() => { setActiveTab('challenges'); setShowChallengeForm(true) }} className="btn-secondary text-sm px-4 py-2">⚡ Create Challenge</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBSCRIBERS ── */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold dark:text-white">All Users ({subscribers.length})</h2>
              <button onClick={exportEmails} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-2"><Mail className="w-4 h-4" /> Export CSV</button>
            </div>
            {subscribers.map(sub => (
              <div key={sub.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {/* Green/red dot — logged today or not */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${todayLoggedIds.has(sub.id) ? 'bg-green-500' : 'bg-red-400'}`} title={todayLoggedIds.has(sub.id) ? 'Logged today' : 'Not logged today'} />
                      <p className="font-medium dark:text-white">{sub.full_name || '—'}</p>
                    </div>
                    <p className="text-sm text-gray-500 ml-4">{sub.email}</p>
                    <div className="flex flex-wrap gap-2 mt-1 ml-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.subscription_status)}`}>{sub.subscription_status}</span>
                      <span className="text-xs text-gray-400">{(sub.total_steps||0).toLocaleString()} steps</span>
                      <span className="text-xs text-gray-400">Joined {new Date(sub.created_at).toLocaleDateString('en-NZ')}</span>
                      {sub.stripe_subscription_id && <span className="text-xs text-cobalt-400">💳 Stripe active</span>}
                      <span className={`text-xs font-semibold ${todayLoggedIds.has(sub.id) ? 'text-green-500' : 'text-red-400'}`}>
                        {todayLoggedIds.has(sub.id) ? '✅ Logged today' : '❌ Not logged today'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {sub.subscription_status !== 'cancelled' && (
                      <button onClick={() => setConfirmCancel(sub.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(sub.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
                {confirmCancel === sub.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-amber-500 font-medium">Cancel {sub.full_name || sub.email}'s subscription?</p>
                    <p className="text-xs text-gray-400">{sub.stripe_subscription_id ? '⚡ This will also cancel their Stripe subscription — no more charges.' : 'They will lose app access. Their data is kept.'}</p>
                    <div className="flex gap-2">
                      <button onClick={() => cancelSubscription(sub.id)} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white">Yes, cancel</button>
                      <button onClick={() => setConfirmCancel(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Keep active</button>
                    </div>
                  </motion.div>
                )}
                {confirmDelete === sub.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-red-400 font-medium">Permanently delete {sub.full_name || sub.email}?</p>
                    <p className="text-xs text-gray-400">Removes their profile, steps, challenge history and login.{' '}{sub.stripe_subscription_id && <span className="text-red-400 font-medium">Stripe subscription will also be cancelled. </span>}Cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => deleteAccount(sub.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white">Yes, delete {sub.stripe_subscription_id ? '+ cancel Stripe' : ''}</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold dark:text-white">
                {activeChallenge ? `${activeChallenge.title}` : 'Leaderboard'}
              </h2>
              <button onClick={fetchAll} className="btn-secondary text-sm px-3 py-1.5">🔄 Refresh</button>
            </div>

            {/* Challenge standings */}
            {activeChallenge && challengeLogs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Challenge standings · {activeChallenge.start_date} → {activeChallenge.end_date}
                </p>
                {challengeLogs.map((entry, i) => {
                  const loggedToday = todayLoggedIds.has(entry.userId)
                  const todayLog = stepLogs.find(l => l.user_id === entry.userId)
                  return (
                    <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`card space-y-3 ${entry.steps > 200000 ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="text-2xl w-10 text-center flex-shrink-0">{getRankEmoji(i)}</div>

                        {/* Name + logged indicator */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold dark:text-white">{entry.name}</p>
                            {/* Green/red logged today dot */}
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${loggedToday ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {loggedToday ? '🟢 Logged today' : '🔴 Not logged today'}
                            </span>
                            {entry.steps > 200000 && (
                              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> Review needed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{entry.email}</p>
                        </div>

                        {/* Total steps */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black dark:text-white">{entry.steps.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">total steps</p>
                        </div>
                      </div>

                      {/* Today's steps + photo + edit */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-400">
                          {loggedToday
                            ? <span className="text-green-400">Today: <strong>{todayLog?.steps?.toLocaleString()}</strong> steps</span>
                            : <span className="text-red-400">No steps logged yet today</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* View latest proof photo */}
                          {entry.lastPhoto && (
                            <button
                              onClick={() => setLightboxPhoto({ url: entry.lastPhoto!, name: entry.name, steps: todayLog?.steps || entry.steps, date: entry.lastDate })}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-cobalt-500/10 text-cobalt-400 hover:bg-cobalt-500/20 transition-all"
                            >
                              <Image className="w-3.5 h-3.5" /> View photo
                            </button>
                          )}
                          {/* Edit today's steps */}
                          {editingSteps === entry.userId ? (
                            <div className="flex items-center gap-1.5">
                              <input type="number" value={editStepValue} onChange={e => setEditStepValue(e.target.value)} className="input w-24 text-xs py-1" placeholder="Steps" />
                              <button onClick={() => overrideSteps(entry.userId)} className="btn-primary text-xs px-2 py-1">Save</button>
                              <button onClick={() => setEditingSteps(null)} className="btn-secondary text-xs px-2 py-1">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditingSteps(entry.userId); setEditStepValue(todayLog?.steps?.toString() || '') }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                ✏️ Edit today
                              </button>
                              {loggedToday && (
                                <button onClick={() => deleteStepLog(entry.userId)}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                  🗑 Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {activeChallenge && challengeLogs.length === 0 && (
              <div className="card text-center py-8 text-gray-400">
                <p className="text-2xl mb-2">👟</p>
                <p>No steps logged in this challenge yet.</p>
              </div>
            )}

            {!activeChallenge && (
              <div className="card text-center py-8 text-gray-400">
                <p className="text-2xl mb-2">📅</p>
                <p>No active challenge right now.</p>
                <p className="text-xs mt-1">Standings will appear here when a challenge is running.</p>
              </div>
            )}

            {/* Today's raw log — still shown below for reference */}
            {stepLogs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Today's submissions — {new Date().toLocaleDateString('en-NZ')}</p>
                {stepLogs.map((log, i) => (
                  <div key={log.id} className={`card flex items-center justify-between gap-4 py-3 ${log.steps > 50000 ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-7">{i + 1}</span>
                      <div>
                        <p className="font-medium dark:text-white text-sm flex items-center gap-2">
                          {log.profiles?.full_name || log.profiles?.email || 'Unknown'}
                          {log.steps > 50000 && <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Suspicious</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">via {log.source?.replace(/_/g, ' ')}</p>
                          {log.photo_url && (
                            <button onClick={() => setLightboxPhoto({ url: log.photo_url, name: log.profiles?.full_name || 'Unknown', steps: log.steps, date: new Date().toLocaleDateString('en-NZ') })}
                              className="text-xs text-cobalt-400 hover:text-cobalt-300 flex items-center gap-1">
                              <Image className="w-3 h-3" /> View photo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="font-bold dark:text-white">{log.steps.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHALLENGES ── */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold dark:text-white">Challenges</h2>
              <button onClick={() => setShowChallengeForm(!showChallengeForm)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><Plus className="w-4 h-4" /> New Challenge</button>
            </div>
            {showChallengeForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-5">
                <h3 className="font-bold dark:text-white text-lg">Create New Challenge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="label">Challenge Title</label><input className="input" placeholder="Leaton Family Challenge" value={challengeForm.title} onChange={e => setChallengeForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><label className="label">Start Date</label><input className="input" type="date" value={challengeForm.start_date} onChange={e => setChallengeForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><label className="label">Start Time</label><input className="input" type="time" value={challengeForm.start_time} onChange={e => setChallengeForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                  <div><label className="label">End Date</label><input className="input" type="date" value={challengeForm.end_date} onChange={e => setChallengeForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                  <div><label className="label">End Time</label><input className="input" type="time" value={challengeForm.end_time} onChange={e => setChallengeForm(p => ({ ...p, end_time: e.target.value }))} /></div>
                  <div><label className="label">Prize Amount (NZD)</label><input className="input" type="number" placeholder="150" value={challengeForm.prize_amount} onChange={e => setChallengeForm(p => ({ ...p, prize_amount: e.target.value }))} /></div>
                  <div><label className="label">Max Participants</label><input className="input" type="number" placeholder="30" value={challengeForm.participant_limit} onChange={e => setChallengeForm(p => ({ ...p, participant_limit: e.target.value }))} /></div>
                </div>
                <div>
                  <label className="label">Allowed Countries</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {COUNTRIES.map(country => (
                      <label key={country} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${challengeForm.allowed_countries.includes(country) ? 'border-cobalt-500 bg-cobalt-500/10' : 'border-gray-200 dark:border-lpr-border'}`}>
                        <input type="checkbox" checked={challengeForm.allowed_countries.includes(country)} onChange={() => toggleCountry(country)} className="accent-cobalt-500" />
                        <span className="text-sm dark:text-gray-300">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={challengeForm.invite_only} onChange={e => setChallengeForm(p => ({ ...p, invite_only: e.target.checked }))} className="w-4 h-4 accent-cobalt-500" />
                    <span className="text-sm dark:text-gray-300">Invite only</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border transition-all ${challengeForm.auto_enrol_subscribers ? 'border-green-500 bg-green-500/10' : 'border-gray-200 dark:border-lpr-border'}`}>
                    <input type="checkbox" checked={challengeForm.auto_enrol_subscribers} onChange={e => setChallengeForm(p => ({ ...p, auto_enrol_subscribers: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                    <div>
                      <span className="text-sm dark:text-gray-300 font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Auto-enrol all subscribers</span>
                      {challengeForm.auto_enrol_subscribers && <p className="text-xs text-green-500 mt-0.5">{enrolCount} subscriber{enrolCount !== 1 ? 's' : ''} will be added</p>}
                    </div>
                  </label>
                </div>
                <div><label className="label">📝 Challenge Instructions</label><textarea className="input" rows={6} value={challengeForm.custom_instructions} onChange={e => setChallengeForm(p => ({ ...p, custom_instructions: e.target.value }))} /></div>
                <div className="flex gap-2">
                  <button onClick={createChallenge} className="btn-primary">Create Challenge + Generate Link</button>
                  <button onClick={() => setShowChallengeForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </motion.div>
            )}
            {editingChallenge && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-5 border-cobalt-500/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold dark:text-white text-lg">✏️ Edit Challenge</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm dark:text-gray-300">Active</span>
                    <input type="checkbox" checked={editingChallenge.is_active} onChange={e => setEditingChallenge((p: any) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-cobalt-500" />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="label">Challenge Title</label><input className="input" value={editingChallenge.title} onChange={e => setEditingChallenge((p: any) => ({ ...p, title: e.target.value }))} /></div>
                  <div><label className="label">Start Date</label><input className="input" type="date" value={editingChallenge.start_date} onChange={e => setEditingChallenge((p: any) => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><label className="label">Start Time</label><input className="input" type="time" value={editingChallenge.start_time || '06:00'} onChange={e => setEditingChallenge((p: any) => ({ ...p, start_time: e.target.value }))} /></div>
                  <div><label className="label">End Date</label><input className="input" type="date" value={editingChallenge.end_date} onChange={e => setEditingChallenge((p: any) => ({ ...p, end_date: e.target.value }))} /></div>
                  <div><label className="label">End Time</label><input className="input" type="time" value={editingChallenge.end_time || '23:59'} onChange={e => setEditingChallenge((p: any) => ({ ...p, end_time: e.target.value }))} /></div>
                  <div><label className="label">Prize Amount (NZD)</label><input className="input" type="number" value={editingChallenge.prize_amount} onChange={e => setEditingChallenge((p: any) => ({ ...p, prize_amount: e.target.value }))} /></div>
                  <div><label className="label">Max Participants</label><input className="input" type="number" value={editingChallenge.participant_limit} onChange={e => setEditingChallenge((p: any) => ({ ...p, participant_limit: e.target.value }))} /></div>
                </div>
                <div>
                  <label className="label">Allowed Countries</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {COUNTRIES.map(country => (
                      <label key={country} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${editingChallenge.allowed_countries?.includes(country) ? 'border-cobalt-500 bg-cobalt-500/10' : 'border-gray-200 dark:border-lpr-border'}`}>
                        <input type="checkbox" checked={editingChallenge.allowed_countries?.includes(country)} onChange={() => toggleEditCountry(country)} className="accent-cobalt-500" />
                        <span className="text-sm dark:text-gray-300">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div><label className="label">📝 Challenge Instructions</label><textarea className="input" rows={6} value={editingChallenge.custom_instructions} onChange={e => setEditingChallenge((p: any) => ({ ...p, custom_instructions: e.target.value }))} /></div>
                <div className="flex gap-2">
                  <button onClick={saveEditChallenge} className="btn-primary">Save Changes</button>
                  <button onClick={() => setEditingChallenge(null)} className="btn-secondary">Cancel</button>
                </div>
              </motion.div>
            )}
            {challenges.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">No challenges yet.</div>
            ) : challenges.map(ch => (
              <div key={ch.id} className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold dark:text-white">{ch.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ch.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>{ch.is_active ? 'Active' : 'Ended'}</span>
                    <button onClick={() => startEditChallenge(ch)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-cobalt-500/10 text-cobalt-400 hover:bg-cobalt-500/20"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setConfirmDeleteChallenge(ch.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span>📅 {ch.start_date} {ch.start_time} → {ch.end_date} {ch.end_time}</span>
                  <span>👥 {ch.current_participants || 0}/{ch.participant_limit} joined</span>
                  {ch.prize_pool?.length > 0 && <span>💰 ${ch.prize_pool[0].amount} NZD</span>}
                  {ch.allowed_countries?.length > 0 && <span>🌏 {ch.allowed_countries.join(', ')}</span>}
                </div>
                <button onClick={() => enrolAllSubscribers(ch.id)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 w-fit">
                  <Users className="w-3.5 h-3.5" /> Enrol all {enrolCount} subscribers
                </button>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Invite Link</p>
                  {editingSlug === ch.id ? (
                    <div className="flex gap-2">
                      <input value={editSlugValue} onChange={e => setEditSlugValue(e.target.value)} className="input flex-1 text-sm" placeholder="my-custom-link" />
                      <button onClick={() => updateSlug(ch.id)} className="btn-primary text-xs px-3">Save</button>
                      <button onClick={() => setEditingSlug(null)} className="btn-secondary text-xs px-3">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                      <span className="text-xs text-gray-500 flex-1 truncate">{typeof window !== 'undefined' ? window.location.origin : 'https://lpr-step-challenge.vercel.app'}/join/{ch.invite_slug}</span>
                      <button onClick={() => { setEditingSlug(ch.id); setEditSlugValue(ch.invite_slug || '') }} className="text-xs text-cobalt-400 hover:text-cobalt-300 shrink-0">Edit</button>
                      <button onClick={() => copyLink(ch.invite_slug)} className="flex items-center gap-1 text-xs bg-cobalt-500 text-white px-3 py-1.5 rounded-lg hover:bg-cobalt-600 shrink-0">
                        {copiedSlug === ch.invite_slug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedSlug === ch.invite_slug ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-gray-400 font-medium">👥 Participants ({(challengeParticipants[ch.id] || []).length}/{ch.participant_limit})</p>
                  {(challengeParticipants[ch.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No one has joined yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(challengeParticipants[ch.id] || []).map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${todayLoggedIds.has(p.user_id) ? 'bg-green-500' : 'bg-red-400'}`} />
                            <div>
                              <p className="text-sm dark:text-white font-medium">{p.profiles?.full_name || '—'}</p>
                              <p className="text-xs text-gray-400">{p.profiles?.email}</p>
                            </div>
                          </div>
                          {confirmRemoveParticipant === p.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400">Remove?</span>
                              <button onClick={() => removeParticipant(p.id, ch.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white">Yes</button>
                              <button onClick={() => setConfirmRemoveParticipant(null)} className="text-xs px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmRemoveParticipant(p.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── DELETE CHALLENGE confirmation ── */}
                {confirmDeleteChallenge === ch.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-red-400 font-medium">Delete "{ch.title}"?</p>
                    <p className="text-xs text-gray-400">Removes the challenge and all participant records. Cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => deleteChallenge(ch.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white">Yes, delete</button>
                      <button onClick={() => setConfirmDeleteChallenge(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cancel</button>
                    </div>
                  </motion.div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* ── SPONSORS ── */}
        {activeTab === 'sponsors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold dark:text-white">Sponsors</h2>
              <button onClick={() => setShowSponsorForm(!showSponsorForm)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><Plus className="w-4 h-4" /> Add Sponsor</button>
            </div>
            {showSponsorForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
                <h3 className="font-bold dark:text-white">Add Sponsor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Company Name</label><input className="input" placeholder="Z Energy" value={sponsorForm.name} onChange={e => setSponsorForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">Website URL</label><input className="input" placeholder="https://z.co.nz" value={sponsorForm.link} onChange={e => setSponsorForm(p => ({ ...p, link: e.target.value }))} /></div>
                  <div><label className="label">Logo URL</label><input className="input" placeholder="https://..." value={sponsorForm.logo_url} onChange={e => setSponsorForm(p => ({ ...p, logo_url: e.target.value }))} /></div>
                  <div><label className="label">Tagline</label><input className="input" placeholder="$500 in vouchers!" value={sponsorForm.tagline} onChange={e => setSponsorForm(p => ({ ...p, tagline: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2"><button onClick={saveSponsor} className="btn-primary">Save</button><button onClick={() => setShowSponsorForm(false)} className="btn-secondary">Cancel</button></div>
              </motion.div>
            )}
            {sponsors.length === 0 ? <div className="card text-center py-8 text-gray-400">No sponsors yet.</div> : sponsors.map(sp => (
              <div key={sp.id} className="card flex items-center justify-between gap-4">
                <div><p className="font-medium dark:text-white">{sp.name}</p>{sp.tagline && <p className="text-xs text-gray-400">{sp.tagline}</p>}</div>
                <button onClick={async () => { await supabase.from('sponsors').delete().eq('id', sp.id); fetchAll() }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <h2 className="font-bold dark:text-white">Challenge Feedback ({feedback.length} responses)</h2>
            {Object.keys(priceSummary).length > 0 && (
              <div className="card space-y-3">
                <h3 className="font-medium dark:text-white">💰 What would people pay to win $1,000?</h3>
                <div className="space-y-2">
                  {Object.entries(priceSummary).sort().map(([price, count]: any) => (
                    <div key={price} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-16">{price}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-cobalt-500 h-4 rounded-full" style={{ width: `${(count / feedback.length) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium dark:text-white">{count} votes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {feedback.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">No feedback yet.</div>
            ) : feedback.map(f => (
              <div key={f.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium dark:text-white">{f.profiles?.full_name || f.profiles?.email}</p>
                  <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < f.stars ? 'text-amber-400' : 'text-gray-300'}>★</span>)}</div>
                </div>
                {f.enjoyed && <p className="text-sm text-gray-400"><strong className="text-gray-300">Enjoyed:</strong> {f.enjoyed}</p>}
                {f.improve && <p className="text-sm text-gray-400"><strong className="text-gray-300">Improve:</strong> {f.improve}</p>}
                {f.would_rejoin && <p className="text-sm text-gray-400"><strong className="text-gray-300">Would rejoin:</strong> {f.would_rejoin}</p>}
                {f.price_willing_to_pay && <p className="text-sm text-amber-500"><strong>Would pay:</strong> {f.price_willing_to_pay}</p>}
                <p className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString('en-NZ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
