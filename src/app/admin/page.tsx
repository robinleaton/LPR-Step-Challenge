'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Users, Trophy, CreditCard, Plus, Edit, Trash2, Image, Link, ArrowLeft } from 'lucide-react'
import { formatSteps, getAge, AGE_BRACKETS } from '@/lib/constants'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'challenges' | 'sponsors'>('overview')
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, revenue: 0 })
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [showSponsorForm, setShowSponsorForm] = useState(false)

  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '', start_date: '', end_date: '',
    gender_filter: 'all', min_age: '', max_age: '',
    prize_description: '', prize_amount: '', paid_only: true,
  })

  const [sponsorForm, setSponsorForm] = useState({
    name: '', logo_url: '', link: '', tagline: '', is_active: true,
  })

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
    // Subscribers
    const { data: subs } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (subs) {
      setSubscribers(subs)
      setStats({
        total: subs.length,
        active: subs.filter(s => s.subscription_status === 'active').length,
        trial: subs.filter(s => s.subscription_status === 'trial').length,
        revenue: subs.filter(s => s.subscription_status === 'active').length * 15,
      })
    }

    // Challenges
    const { data: ch } = await supabase.from('challenges').select('*').order('created_at', { ascending: false })
    if (ch) setChallenges(ch)

    // Sponsors
    const { data: sp } = await supabase.from('sponsors').select('*').order('display_order')
    if (sp) setSponsors(sp)

    setLoading(false)
  }

  const createChallenge = async () => {
    const { error } = await supabase.from('challenges').insert({
      title: challengeForm.title,
      description: challengeForm.description,
      start_date: challengeForm.start_date,
      end_date: challengeForm.end_date,
      gender_filter: challengeForm.gender_filter,
      min_age: challengeForm.min_age ? parseInt(challengeForm.min_age) : null,
      max_age: challengeForm.max_age ? parseInt(challengeForm.max_age) : null,
      prize_pool: challengeForm.prize_amount ? [{ place: 1, amount: parseFloat(challengeForm.prize_amount), description: challengeForm.prize_description }] : [],
      paid_only: challengeForm.paid_only,
      country_filter: 'NZ',
      is_active: true,
    })
    if (!error) {
      toast.success('Challenge created!')
      setShowChallengeForm(false)
      fetchAll()
    } else {
      toast.error(error.message)
    }
  }

  const saveSponsor = async () => {
    const { error } = await supabase.from('sponsors').insert(sponsorForm)
    if (!error) {
      toast.success('Sponsor saved!')
      setShowSponsorForm(false)
      fetchAll()
    } else {
      toast.error(error.message)
    }
  }

  const toggleSponsor = async (id: string, is_active: boolean) => {
    await supabase.from('sponsors').update({ is_active: !is_active }).eq('id', id)
    fetchAll()
  }

  const deleteSponsor = async (id: string) => {
    await supabase.from('sponsors').delete().eq('id', id)
    toast.success('Sponsor removed')
    fetchAll()
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'text-green-500 bg-green-500/10'
    if (status === 'trial') return 'text-amber-500 bg-amber-500/10'
    return 'text-red-400 bg-red-400/10'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-lpr-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-lpr-card border-b border-gray-200 dark:border-lpr-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-cobalt-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">LPR</span>
            </div>
            <h1 className="font-bold dark:text-white">Admin Dashboard</h1>
          </div>
          <span className="text-xs bg-cobalt-500/20 text-cobalt-400 px-2 py-1 rounded-full">Robin — Admin</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'overview', label: '📊 Overview', icon: null },
            { id: 'subscribers', label: '👥 Subscribers', icon: null },
            { id: 'challenges', label: '🏆 Challenges', icon: null },
            { id: 'sponsors', label: '🤝 Sponsors', icon: null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-cobalt-500 text-white' : 'bg-white dark:bg-lpr-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-lpr-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total, icon: <Users className="w-5 h-5" />, color: 'text-cobalt-500' },
              { label: 'Active Subs', value: stats.active, icon: <CreditCard className="w-5 h-5" />, color: 'text-green-500' },
              { label: 'On Trial', value: stats.trial, icon: <Users className="w-5 h-5" />, color: 'text-amber-500' },
              { label: 'Monthly Revenue', value: `$${stats.revenue} NZD`, icon: <CreditCard className="w-5 h-5" />, color: 'text-cobalt-500' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card text-center space-y-2">
                <div className={`${stat.color} flex justify-center`}>{stat.icon}</div>
                <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Subscribers */}
        {activeTab === 'subscribers' && (
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold dark:text-white">All Users ({subscribers.length})</h2>
              <button onClick={() => {
                const csv = [
                  ['Name', 'Email', 'Gender', 'DOB', 'Status', 'Total Steps', 'Joined'].join(','),
                  ...subscribers.map(s => [s.full_name, s.email, s.gender, s.date_of_birth, s.subscription_status, s.total_steps, s.created_at].join(','))
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'lpr-subscribers.csv'; a.click()
              }} className="btn-secondary text-sm px-3 py-1.5">
                Export CSV
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-200 dark:border-lpr-border">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Gender</th>
                  <th className="pb-2 pr-4">Age</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Steps</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-lpr-border">
                {subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 pr-4 font-medium dark:text-white">{sub.full_name || '—'}</td>
                    <td className="py-2 pr-4 text-gray-500">{sub.email}</td>
                    <td className="py-2 pr-4 text-gray-500 capitalize">{sub.gender || '—'}</td>
                    <td className="py-2 pr-4 text-gray-500">{sub.date_of_birth ? getAge(sub.date_of_birth) : '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.subscription_status)}`}>
                        {sub.subscription_status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{formatSteps(sub.total_steps || 0)}</td>
                    <td className="py-2 text-gray-400 text-xs">{new Date(sub.created_at).toLocaleDateString('en-NZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Challenges */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold dark:text-white">Challenges</h2>
              <button onClick={() => setShowChallengeForm(!showChallengeForm)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus className="w-4 h-4" /> New Challenge
              </button>
            </div>

            {showChallengeForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
                <h3 className="font-bold dark:text-white">Create New Challenge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Title</label>
                    <input className="input" placeholder="March Step Challenge" value={challengeForm.title}
                      onChange={e => setChallengeForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><label className="label">Prize Amount (NZD)</label>
                    <input className="input" type="number" placeholder="500" value={challengeForm.prize_amount}
                      onChange={e => setChallengeForm(p => ({ ...p, prize_amount: e.target.value }))} /></div>
                  <div><label className="label">Start Date</label>
                    <input className="input" type="date" value={challengeForm.start_date}
                      onChange={e => setChallengeForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><label className="label">End Date</label>
                    <input className="input" type="date" value={challengeForm.end_date}
                      onChange={e => setChallengeForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                  <div><label className="label">Gender Category</label>
                    <select className="input" value={challengeForm.gender_filter}
                      onChange={e => setChallengeForm(p => ({ ...p, gender_filter: e.target.value }))}>
                      <option value="all">All genders</option>
                      <option value="male">Male only</option>
                      <option value="female">Female only</option>
                    </select></div>
                  <div><label className="label">Age Range (optional)</label>
                    <div className="flex gap-2">
                      <input className="input" type="number" placeholder="Min age" value={challengeForm.min_age}
                        onChange={e => setChallengeForm(p => ({ ...p, min_age: e.target.value }))} />
                      <input className="input" type="number" placeholder="Max age" value={challengeForm.max_age}
                        onChange={e => setChallengeForm(p => ({ ...p, max_age: e.target.value }))} />
                    </div></div>
                </div>
                <div><label className="label">Description</label>
                  <textarea className="input" rows={2} placeholder="Challenge details..." value={challengeForm.description}
                    onChange={e => setChallengeForm(p => ({ ...p, description: e.target.value }))} /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={challengeForm.paid_only}
                    onChange={e => setChallengeForm(p => ({ ...p, paid_only: e.target.checked }))}
                    className="w-4 h-4 accent-cobalt-500" />
                  <span className="text-sm dark:text-gray-300">Paid subscribers only eligible for prize</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={createChallenge} className="btn-primary">Create Challenge</button>
                  <button onClick={() => setShowChallengeForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </motion.div>
            )}

            {challenges.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">No challenges yet. Create your first one!</div>
            ) : (
              challenges.map(ch => (
                <div key={ch.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold dark:text-white">{ch.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ch.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                      {ch.is_active ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    <span>📅 {ch.start_date} → {ch.end_date}</span>
                    <span>👥 {ch.gender_filter === 'all' ? 'All genders' : ch.gender_filter}</span>
                    {ch.min_age && <span>🎂 Ages {ch.min_age}–{ch.max_age}</span>}
                    {ch.paid_only && <span>💳 Paid only</span>}
                    {ch.prize_pool?.length > 0 && <span>💰 ${ch.prize_pool[0].amount} NZD prize</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sponsors */}
        {activeTab === 'sponsors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold dark:text-white">Sponsor Footer</h2>
              <button onClick={() => setShowSponsorForm(!showSponsorForm)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus className="w-4 h-4" /> Add Sponsor
              </button>
            </div>

            <div className="card bg-cobalt-500/5 border-cobalt-500/20">
              <p className="text-sm text-gray-400">
                💡 Only <strong className="text-cobalt-400">one active sponsor</strong> shows in the footer at a time.
                When no sponsor is active, the LPR logo and <em>"You break it, we fix it"</em> tagline shows instead.
              </p>
            </div>

            {showSponsorForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
                <h3 className="font-bold dark:text-white">Add Sponsor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Company Name</label>
                    <input className="input" placeholder="Z Energy" value={sponsorForm.name}
                      onChange={e => setSponsorForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">Website URL</label>
                    <input className="input" placeholder="https://z.co.nz" value={sponsorForm.link}
                      onChange={e => setSponsorForm(p => ({ ...p, link: e.target.value }))} /></div>
                  <div><label className="label">Logo URL (optional)</label>
                    <input className="input" placeholder="https://..." value={sponsorForm.logo_url}
                      onChange={e => setSponsorForm(p => ({ ...p, logo_url: e.target.value }))} /></div>
                  <div><label className="label">Tagline (optional)</label>
                    <input className="input" placeholder="$500 in petrol vouchers up for grabs!" value={sponsorForm.tagline}
                      onChange={e => setSponsorForm(p => ({ ...p, tagline: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveSponsor} className="btn-primary">Save Sponsor</button>
                  <button onClick={() => setShowSponsorForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </motion.div>
            )}

            {sponsors.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">
                No sponsors yet. The LPR default footer is currently showing.
              </div>
            ) : (
              sponsors.map(sp => (
                <div key={sp.id} className="card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {sp.logo_url
                      ? <img src={sp.logo_url} alt={sp.name} className="h-10 object-contain" />
                      : <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs font-bold">{sp.name[0]}</div>
                    }
                    <div>
                      <p className="font-medium dark:text-white">{sp.name}</p>
                      {sp.tagline && <p className="text-xs text-gray-400">{sp.tagline}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSponsor(sp.id, sp.is_active)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${sp.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                      {sp.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => deleteSponsor(sp.id)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
