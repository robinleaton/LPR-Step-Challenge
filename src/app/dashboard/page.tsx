'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { MaleAvatar } from '@/components/avatar/MaleAvatar'
import { FemaleAvatar } from '@/components/avatar/FemaleAvatar'
import { getAvatarStage, formatSteps } from '@/lib/constants'
import { Home, Trophy, Camera, Flame, Calendar, Settings } from 'lucide-react'

type Tab = 'home' | 'leaderboard'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [todaySteps, setTodaySteps] = useState<number | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [challenge, setChallenge] = useState<any>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (prof) {
        setProfile(prof)
        setIsAdmin(prof.is_admin === true)
      }

      const today = new Date().toISOString().split('T')[0]

      // Today's steps
      const { data: log } = await supabase
        .from('step_logs')
        .select('steps')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      if (log) setTodaySteps(log.steps)

      // Active challenge
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenges(id, title, start_date, end_date)')
        .eq('user_id', user.id)
      const allChallenges = (participations || []).map((p: any) => p.challenges).filter(Boolean)
      const active = allChallenges.find((c: any) => today >= c.start_date && today <= c.end_date)
        || [...allChallenges].sort((a: any, b: any) => b.start_date.localeCompare(a.start_date))[0]
      if (active) setChallenge(active)

      // Current streak
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: logs } = await supabase
        .from('step_logs')
        .select('date, steps')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      const logMap: Record<string, number> = {}
      logs?.forEach((l: any) => { logMap[l.date] = l.steps })
      let streak = 0
      const check = new Date()
      if (!logMap[today]) check.setDate(check.getDate() - 1)
      while (true) {
        const k = check.toISOString().split('T')[0]
        if (logMap[k] && logMap[k] > 0) { streak++; check.setDate(check.getDate() - 1) }
        else break
      }
      setCurrentStreak(streak)

      setLoading(false)
    }
    init()
  }, [router])

  const stage = profile ? getAvatarStage(profile.total_steps || 0) : { stage: 1, name: 'Couch Potato' }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black pb-20">

      {activeTab === 'home' && (
        <div>
          {/* Header */}
          <div className="px-4 pt-12 pb-5 flex items-start justify-between"
            style={{ background: 'linear-gradient(180deg, #0d1233 0%, transparent 100%)' }}>
            <div>
              <p className="text-sm text-gray-400">{getGreeting()} 👋</p>
              <h1 className="text-2xl font-black dark:text-white mt-1">
                {profile?.full_name?.split(' ')[0] || 'there'}
              </h1>
            </div>
            {/* Admin button — only visible to admin users */}
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all mt-1"
                style={{
                  background: 'rgba(59,91,255,0.15)',
                  border: '1px solid rgba(59,91,255,0.35)',
                  color: '#7c9dff',
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </div>

          {/* Challenge card */}
          {challenge && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-3 rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0e1840, #0a0a1a)', border: '1px solid rgba(59,91,255,0.25)' }}
            >
              <p className="text-xs font-bold text-cobalt-400 uppercase tracking-wider mb-1">Active Challenge</p>
              <p className="text-lg font-black dark:text-white mb-2">{challenge.title}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cobalt-500/20 text-cobalt-400 border border-cobalt-500/30">
                  📅 {challenge.start_date} → {challenge.end_date}
                </span>
                {rank && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    #{rank} place
                  </span>
                )}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-10">🏆</div>
            </motion.div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mx-4 mb-3">
            {[
              { val: todaySteps !== null ? todaySteps.toLocaleString() : '—', lbl: 'Steps today', color: 'text-cobalt-400' },
              { val: profile?.total_steps ? formatSteps(profile.total_steps) : '—', lbl: 'Total steps', color: 'text-green-400' },
              { val: `${currentStreak}`, lbl: 'Day streak 🔥', color: 'text-amber-400' },
              { val: stage.name, lbl: 'Avatar stage', color: 'text-purple-400' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-xs text-gray-500 mt-1 font-semibold">{s.lbl}</div>
              </motion.div>
            ))}
          </div>

          {/* Submit CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push('/submit')}
            className="mx-4 mb-3 rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #3b5bff, #7c3aed)',
              boxShadow: '0 8px 30px rgba(59,91,255,0.3)',
            }}
          >
            <span className="text-3xl">📸</span>
            <div className="flex-1">
              <div className="text-base font-black text-white">Log Today's Steps</div>
              <div className="text-xs text-white/70">Upload a photo · AI reads it for you</div>
            </div>
            <span className="text-white/50 text-xl">→</span>
          </motion.div>

          {/* Streak mini */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/app/streak')}
            className="mx-4 mb-3 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1a0d2e, #13131f)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            <span className="text-4xl" style={{ animation: 'flicker 1.5s ease-in-out infinite' }}>🔥</span>
            <div>
              <div className="text-3xl font-black"
                style={{ background: 'linear-gradient(135deg, #7c9dff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                {currentStreak}
              </div>
              <div className="text-xs text-gray-400">day streak — tap to view progress</div>
            </div>
            <span className="ml-auto text-gray-500 text-xl">›</span>
          </motion.div>

          {/* Motivation / Why card */}
          {profile?.motivation_why && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card mx-4 mb-3"
              style={{ background: 'linear-gradient(135deg, #0b1430, #13131f)', borderColor: 'rgba(59,91,255,0.2)' }}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your why</p>
              <p className="text-sm text-gray-400 italic leading-relaxed">
                "{profile.motivation_why}"
              </p>
            </motion.div>
          )}

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card mx-4 mb-3 flex items-center gap-4"
          >
            <div className="flex-shrink-0">
              {profile?.gender === 'female'
                ? <FemaleAvatar stage={stage.stage} size={64} animated />
                : <MaleAvatar stage={stage.stage} size={64} animated />}
            </div>
            <div>
              <p className="font-bold dark:text-white">{stage.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {profile?.total_steps ? formatSteps(profile.total_steps) : '0'} total steps
              </p>
              <p className="text-xs text-cobalt-400 mt-1">Keep stepping to level up →</p>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="px-4 pt-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black dark:text-white">Leaderboard</h1>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: 'rgba(59,91,255,0.15)',
                  border: '1px solid rgba(59,91,255,0.35)',
                  color: '#7c9dff',
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </div>
          <Leaderboard currentUserId={user?.id} showFilters={true} />
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid #1e1e35' }}>
        {[
          { emoji: '🏠', label: 'Home', action: () => setActiveTab('home'), active: activeTab === 'home' },
          { emoji: '🏆', label: 'Board', action: () => setActiveTab('leaderboard'), active: activeTab === 'leaderboard' },
          { emoji: '📸', label: 'Submit', action: () => router.push('/submit'), active: false },
          { emoji: '🔥', label: 'Streak', action: () => router.push('/app/streak'), active: false },
          { emoji: '📅', label: 'Calendar', action: () => router.push('/app/calendar'), active: false },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 pb-4 transition-opacity ${item.active ? 'opacity-100' : 'opacity-40'}`}>
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-cobalt-400">{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
      `}</style>
    </div>
  )
}
