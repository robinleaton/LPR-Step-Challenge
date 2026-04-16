'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Trophy, Star, Zap, Target } from 'lucide-react'
import { formatSteps, getAvatarStage, AGE_BRACKETS } from '@/lib/constants'

const TODAY_STEPS = 6023 // will be replaced by real query below

interface StreakData {
  currentStreak: number
  bestStreak: number
  weekDays: { label: string; steps: number; status: 'done' | 'miss' | 'today' | 'future' }[]
  weekGoalDays: number
  weekTotalDays: number
  goalMet: boolean
}

export default function StreakPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [goalSteps, setGoalSteps] = useState(8000)
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    weekDays: [],
    weekGoalDays: 0,
    weekTotalDays: 7,
    goalMet: false,
  })
  const [todaySteps, setTodaySteps] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Get last 30 days of step logs
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

      // Today's steps
      setTodaySteps(logMap[todayStr] || 0)

      // Calculate current streak
      let streak = 0
      const check = new Date(today)
      // if today has steps, start from today, else start from yesterday
      if (!logMap[todayStr]) check.setDate(check.getDate() - 1)
      while (true) {
        const k = check.toISOString().split('T')[0]
        if (logMap[k] && logMap[k] > 0) {
          streak++
          check.setDate(check.getDate() - 1)
        } else break
      }

      // Best streak (simplified: check last 30 days)
      let best = 0, cur = 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const k = d.toISOString().split('T')[0]
        if (logMap[k] && logMap[k] > 0) { cur++; if (cur > best) best = cur }
        else cur = 0
      }

      // This week (Mon–Sun)
      const dayOfWeek = (today.getDay() + 6) % 7 // 0=Mon
      const weekDays: StreakData['weekDays'] = []
      const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      let weekGoalDays = 0
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - dayOfWeek + i)
        const k = d.toISOString().split('T')[0]
        const steps = logMap[k] || 0
        let status: 'done' | 'miss' | 'today' | 'future'
        if (k === todayStr) status = 'today'
        else if (k > todayStr) status = 'future'
        else if (steps > 0) { status = 'done'; if (steps >= goalSteps) weekGoalDays++ }
        else status = 'miss'
        weekDays.push({ label: labels[i], steps, status })
      }

      setStreakData({
        currentStreak: streak,
        bestStreak: Math.max(best, streak),
        weekDays,
        weekGoalDays,
        weekTotalDays: 7,
        goalMet: weekGoalDays >= 5,
      })
      setLoading(false)
    }
    init()
  }, [router, goalSteps])

  const goalPct = Math.min(110, Math.round((todaySteps / goalSteps) * 100))
  const remaining = goalSteps - todaySteps

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(180deg, #0d0d2a 0%, transparent 100%)' }}>
        <p className="text-xs text-gray-400 mb-1">Your progress</p>
        <h1 className="text-2xl font-bold dark:text-white" style={{ fontWeight: 800 }}>
          Streak & Goals
        </h1>
      </div>

      {/* Streak Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-3 rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1233, #0a0a1a)',
          border: '1px solid rgba(59,91,255,0.3)',
        }}
      >
        <div className="text-7xl font-black leading-none"
          style={{ background: 'linear-gradient(135deg, #7c9dff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {streakData.currentStreak}
        </div>
        <div className="text-sm text-gray-400 mt-1">day streak 🔥</div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(59,91,255,0.15)', color: '#7c9dff', border: '1px solid rgba(59,91,255,0.3)' }}>
            ⚡ Best: {streakData.bestStreak} days
          </span>
          {todaySteps >= goalSteps && (
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✅ Goal hit today
            </span>
          )}
        </div>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-5xl"
          style={{ animation: 'flicker 1.5s ease-in-out infinite' }}>🔥</div>
      </motion.div>

      {/* This Week Dots */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card mx-4 mb-3"
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">This Week</p>
        <div className="flex justify-between">
          {streakData.weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500">{day.label}</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                day.status === 'today'
                  ? 'bg-cobalt-500 border-cobalt-500 text-white shadow-lg shadow-cobalt-500/40'
                  : day.status === 'done'
                  ? 'bg-cobalt-500/20 border-cobalt-500 text-cobalt-400'
                  : day.status === 'miss'
                  ? 'border-red-500/30 bg-red-500/10 text-gray-500 text-xs'
                  : 'border-gray-700 bg-gray-800 text-gray-600'
              }`}>
                {day.status === 'today' ? '→' : day.status === 'done' ? '✓' : day.status === 'miss' ? '✗' : '·'}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily Goal Setter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mx-4 mb-3"
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Daily Step Goal</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-400">Hit at least</span>
          <input
            type="number"
            value={goalSteps}
            onChange={e => setGoalSteps(parseInt(e.target.value) || 8000)}
            className="input w-24 text-center font-bold text-base"
            style={{ padding: '6px 10px' }}
          />
          <span className="text-sm text-gray-400">steps/day</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {[5000, 8000, 10000, 12000, 15000].map(v => (
            <button key={v} onClick={() => setGoalSteps(v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                goalSteps === v
                  ? 'bg-cobalt-500/20 border-cobalt-500 text-cobalt-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-cobalt-500'
              }`}>
              {v >= 1000 ? `${v / 1000}k` : v}
            </button>
          ))}
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${goalPct}%`, background: 'linear-gradient(90deg, #3b5bff, #7c3aed)' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {remaining > 0
            ? `Today: ${todaySteps.toLocaleString()} steps · ${remaining.toLocaleString()} to go 💪`
            : `Today: ${todaySteps.toLocaleString()} steps · Goal smashed! 🎉`}
        </p>
      </motion.div>

      {/* Weekly Ratio */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card mx-4 mb-3"
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Weekly Ratio</p>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-400">Days hit goal</span>
          <span className="text-sm font-bold dark:text-white">{streakData.weekGoalDays} / 7</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(streakData.weekGoalDays / 7) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-400">Target pace</span>
          <span className="text-sm font-bold dark:text-white">5 / 7</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full bg-amber-500" style={{ width: '71%' }} />
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
          streakData.goalMet
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {streakData.goalMet ? '✅ Weekly goal met!' : '⚡ Keep going — 5 days is the target'}
        </span>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mx-4 mb-3"
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Achievements</p>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {[
            { icon: '🔥', label: '7-Day Streak', earned: streakData.currentStreak >= 7, gold: true },
            { icon: '🚀', label: 'First 10k Day', earned: true, gold: true },
            { icon: '📅', label: '5-Day Streak', earned: streakData.currentStreak >= 5, gold: false },
            { icon: '💎', label: '14-Day Streak', earned: streakData.currentStreak >= 14, gold: false },
            { icon: '👑', label: '30-Day Streak', earned: streakData.currentStreak >= 30, gold: false },
            { icon: '⚡', label: '100k Week', earned: false, gold: false },
          ].map((a, i) => (
            <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                a.earned && a.gold
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/25'
                  : a.earned
                  ? 'border-gray-400 bg-gray-400/15'
                  : 'border-gray-800 bg-gray-900 grayscale opacity-35'
              }`}>
                {a.icon}
              </div>
              <span className="text-[10px] text-gray-400 text-center font-semibold leading-tight">{a.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  )
}
