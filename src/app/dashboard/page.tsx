'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { SponsorFooter } from '@/components/SponsorFooter'
import { getNZMilestone, getNextNZMilestone, formatSteps, stepsToKm } from '@/lib/constants'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Settings, Trophy, Footprints, TrendingUp, Bell, Camera } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<any>(null)
  const [todaySteps, setTodaySteps] = useState(0)
  const [weekSteps, setWeekSteps] = useState(0)
  const [todaySubmitted, setTodaySubmitted] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'challenges' | 'profile'>('home')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData) {
        setProfile(profileData)
        if (profileData.theme) setTheme(profileData.theme)
      }
      const today = new Date().toISOString().split('T')[0]
      const { data: todayLog } = await supabase.from('step_logs').select('steps').eq('user_id', user.id).eq('date', today).single()
      if (todayLog) { setTodaySteps(todayLog.steps); setTodaySubmitted(true) }
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekLogs } = await supabase.from('step_logs').select('steps').eq('user_id', user.id).gte('date', weekAgo.toISOString().split('T')[0])
      setWeekSteps(weekLogs?.reduce((sum: number, l: any) => sum + l.steps, 0) || 0)
      const { data: participant } = await supabase.from('challenge_participants').select('challenge_id').eq('user_id', user.id).single()
      if (participant?.challenge_id) {
        const { data: challenge } = await supabase.from('challenges').select('*').eq('id', participant.challenge_id).single()
        if (challenge) setActiveChallenge(challenge)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth/login') }

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (profile) await supabase.from('profiles').update({ theme: newTheme }).eq('id', profile.id)
  }

  const nzMilestone = profile ? getNZMilestone(profile.total_steps) : null
  const nextNZMilestone = profile ? getNextNZMilestone(profile.total_steps) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div className="w-16 h-16 rounded-full border-4 border-cobalt-500 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-lpr-black">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-lpr-border bg-white/90 dark:bg-lpr-black/90 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cobalt-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">LPR</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">Step Challenge</span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.subscription_status === 'trial' && (
              <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full border border-amber-500/30">Trial</span>
            )}
            <button onClick={handleThemeToggle} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => router.push('/notifications')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            {profile?.is_admin && (
              <button onClick={() => router.push('/admin')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Settings className="w-4 h-4 text-cobalt-500" />
              </button>
            )}
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {activeTab === 'home' && (
          <>
            <div className="card flex flex-col md:flex-row items-center gap-6">
              <AvatarDisplay gender={profile?.gender || 'male'} totalSteps={profile?.total_steps || 0} size={180} />
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
                  <h1 className="text-2xl font-bold dark:text-white">{profile?.full_name || 'Challenger'}</h1>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-cobalt-500">{formatSteps(todaySteps)}</p>
                    <p className="text-xs text-gray-400">Today</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-cobalt-500">{formatSteps(weekSteps)}</p>
                    <p className="text-xs text-gray-400">This week</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-cobalt-500">{formatSteps(profile?.total_steps || 0)}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stepsToKm(profile?.total_steps || 0)} km walked total</p>
              </div>
            </div>

            {activeChallenge && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-r from-cobalt-500/20 to-cobalt-500/5 border-cobalt-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-cobalt-400 font-semibold uppercase tracking-wider">⚡ Active Challenge</p>
                    <h2 className="text-lg font-bold dark:text-white mt-0.5">{activeChallenge.title}</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Ends {activeChallenge.end_date} at {activeChallenge.end_time}
                      {activeChallenge.prize_pool?.[0] && (
                        <span className="ml-2 text-amber-400 font-semibold">· 🏆 ${activeChallenge.prize_pool[0].amount} NZD prize</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-cobalt-500">{activeChallenge.current_participants || 0}</p>
                    <p className="text-xs text-gray-400">participants</p>
                  </div>
                </div>
                {todaySubmitted ? (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-green-500">Steps submitted today!</p>
                      <p className="text-sm text-gray-400">{todaySteps.toLocaleString()} steps logged · Come back tomorrow</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => router.push('/submit')} className="w-full flex items-center justify-center gap-3 bg-cobalt-500 hover:bg-cobalt-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-cobalt-500/30">
                    <Camera className="w-5 h-5" /> Submit Today's Steps
                  </button>
                )}
                <p className="text-xs text-center text-gray-400">⏰ Steps must be submitted before <strong className="text-gray-300">11:59pm tonight</strong></p>
              </motion.div>
            )}

            {(nzMilestone || nextNZMilestone) && (
              <motion.div className="card bg-gradient-to-r from-cobalt-500/10 to-transparent border-cobalt-500/30" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {nzMilestone && <div className="mb-3"><p className="text-xl font-bold dark:text-white">{nzMilestone.emoji} {nzMilestone.description}</p></div>}
                {nextNZMilestone && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Next milestone: <span className="font-medium text-cobalt-500">{nextNZMilestone.label}</span></p>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-cobalt-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((profile?.total_steps || 0) / nextNZMilestone.steps) * 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                    </div>
                    <p className="text-xs text-gray-400">{formatSteps(nextNZMilestone.steps - (profile?.total_steps || 0))} steps away</p>
                  </div>
                )}
              </motion.div>
            )}

            <div className="card">
              <Leaderboard currentUserId={profile?.id} showFilters={false} />
              <button onClick={() => setActiveTab('leaderboard')} className="w-full mt-4 text-sm text-cobalt-500 hover:text-cobalt-400 transition-colors">View full leaderboard →</button>
            </div>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="card"><Leaderboard currentUserId={profile?.id} showFilters={true} /></div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {activeChallenge ? (
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-cobalt-400 font-semibold uppercase tracking-wider">⚡ Your Active Challenge</p>
                    <h2 className="text-xl font-bold dark:text-white mt-1">{activeChallenge.title}</h2>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-medium">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Ends</p>
                    <p className="font-medium dark:text-white">{activeChallenge.end_date}</p>
                    <p className="text-cobalt-400 text-xs">{activeChallenge.end_time}</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Prize 🏆</p>
                    <p className="font-bold text-amber-500 text-lg">${activeChallenge.prize_pool?.[0]?.amount || 0} NZD</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Participants</p>
                    <p className="font-bold dark:text-white">{activeChallenge.current_participants || 0} / {activeChallenge.participant_limit}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Your steps today</p>
                    <p className="font-bold text-cobalt-500">{todaySteps.toLocaleString()}</p>
                  </div>
                </div>
                {todaySubmitted ? (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-green-500">Steps submitted today!</p>
                      <p className="text-sm text-gray-400">{todaySteps.toLocaleString()} steps logged</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => router.push('/submit')} className="w-full flex items-center justify-center gap-3 bg-cobalt-500 hover:bg-cobalt-600 text-white font-bold py-4 rounded-2xl transition-all">
                    <Camera className="w-5 h-5" /> Submit Today's Steps
                  </button>
                )}
                {activeChallenge.description && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-2">📋 From the organiser</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{activeChallenge.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-10 space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-cobalt-500" />
                <h2 className="text-xl font-bold dark:text-white">No Active Challenge</h2>
                <p className="text-gray-400">You're not currently in a challenge. Ask Robin for an invite link!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card space-y-4">
            <h2 className="text-xl font-bold dark:text-white">Your Profile</h2>
            <div className="space-y-3">
              <div><label className="label">Name</label><p className="text-gray-900 dark:text-white">{profile?.full_name}</p></div>
              <div><label className="label">Email</label><p className="text-gray-900 dark:text-white">{profile?.email}</p></div>
              <div>
                <label className="label">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile?.subscription_status === 'active' ? 'bg-green-500/20 text-green-500' : profile?.subscription_status === 'trial' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                  {profile?.subscription_status === 'active' ? '✓ Active Member' : profile?.subscription_status === 'trial' ? '⏱ Free Trial' : 'Inactive'}
                </span>
              </div>
              {profile?.country && <div><label className="label">Country</label><p className="text-gray-900 dark:text-white">{profile.country}</p></div>}
            </div>
          </div>
        )}
      </main>

      <nav className="sticky bottom-0 border-t border-gray-200 dark:border-lpr-border bg-white/90 dark:bg-lpr-black/90 backdrop-blur-sm px-4 py-2">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-1">
          {[
            { id: 'home', icon: <Footprints className="w-5 h-5" />, label: 'Home' },
            { id: 'leaderboard', icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard' },
            { id: 'challenges', icon: <TrendingUp className="w-5 h-5" />, label: 'Challenges' },
            { id: 'profile', icon: <Settings className="w-5 h-5" />, label: 'Profile' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${activeTab === tab.id ? 'text-cobalt-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <SponsorFooter />
    </div>
  )
}
