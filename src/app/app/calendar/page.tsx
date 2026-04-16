'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

interface DayData {
  date: string
  steps: number
  status: 'done' | 'miss' | 'today' | 'future' | 'out'
}

export default function CalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [dayMap, setDayMap] = useState<Record<string, number>>({})
  const [challengeDates, setChallengeDates] = useState<{ start: string; end: string } | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [stats, setStats] = useState({ done: 0, missed: 0, remaining: 0, total: 0 })
  const [completionPct, setCompletionPct] = useState(0)

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenges(start_date, end_date)')
        .eq('user_id', user.id)
      const challenges = (participations || []).map((p: any) => p.challenges).filter(Boolean)
      const active = challenges.find((c: any) => todayStr >= c.start_date && todayStr <= c.end_date)
        || [...challenges].sort((a: any, b: any) => b.start_date.localeCompare(a.start_date))[0]

      if (active) {
        setChallengeDates({ start: active.start_date, end: active.end_date })

        const { data: logs } = await supabase
          .from('step_logs')
          .select('date, steps')
          .eq('user_id', user.id)
          .gte('date', active.start_date)
          .lte('date', active.end_date)

        const map: Record<string, number> = {}
        logs?.forEach((l: any) => { map[l.date] = l.steps })
        setDayMap(map)

        let done = 0, missed = 0, remaining = 0
        const start = new Date(active.start_date)
        const end = new Date(active.end_date)
        const total = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const k = d.toISOString().split('T')[0]
          if (k > todayStr) remaining++
          else if (map[k] && map[k] > 0) done++
          else if (k < todayStr) missed++
        }
        setStats({ done, missed, remaining, total })
        setCompletionPct(total > 0 ? Math.round((done / total) * 100) : 0)
      }
      setLoading(false)
    }
    init()
  }, [router])

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const getDayStatus = (dateStr: string): DayData['status'] => {
    if (dateStr === todayStr) return 'today'
    if (dateStr > todayStr) return 'future'
    if (!challengeDates) return 'out'
    if (dateStr < challengeDates.start || dateStr > challengeDates.end) return 'out'
    return dayMap[dateStr] && dayMap[dateStr] > 0 ? 'done' : 'miss'
  }

  const buildGrid = () => {
    const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ day: d, dateStr, status: getDayStatus(dateStr), steps: dayMap[dateStr] || 0 })
    }
    return cells
  }

  const fk = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1).replace('.0','')}k` : `${n}`

  const r = 36, circ = 2 * Math.PI * r
  const offset = circ - (completionPct / 100) * circ

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black pb-24">

      {/* Header with back button */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0d1233 0%, transparent 100%)' }}>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)' }}
        >
          <ArrowLeft className="w-4 h-4 text-cobalt-400" />
        </button>
        <div>
          <p className="text-xs text-gray-400">Challenge overview</p>
          <h1 className="text-xl font-black dark:text-white leading-tight">Calendar</h1>
        </div>
      </div>

      {/* Completion Ring */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mx-4 mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Challenge Completion</p>
        <div className="flex items-center gap-4">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none" stroke="#1e1e35" strokeWidth="9" />
            <circle cx="44" cy="44" r={r} fill="none"
              stroke="url(#ringGrad)" strokeWidth="9"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b5bff" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex-1">
            <div className="text-3xl font-black dark:text-white">{completionPct}%</div>
            <div className="text-xs text-gray-400 mt-1">{stats.done} of {stats.total} challenge days done</div>
            <div className="text-xs mt-2 p-2 rounded-lg bg-gray-900 text-gray-500 leading-tight">
              Max still possible: <span className="text-amber-400 font-bold">
                {stats.total > 0 ? Math.round(((stats.done + stats.remaining) / stats.total) * 100) : 0}%
              </span>
              <br />{stats.remaining} days left — every one counts
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mx-4 mb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: stats.done, lbl: 'Days Done', color: 'text-cobalt-400' },
            { val: stats.missed, lbl: 'Missed', color: 'text-red-400' },
            { val: stats.remaining, lbl: 'Remaining', color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-gray-500 mt-1 font-semibold">{s.lbl}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mx-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y-- } setCalMonth(m); setCalYear(y) }}
            className="w-8 h-8 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 flex items-center justify-center hover:border-cobalt-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold dark:text-white text-base">{monthNames[calMonth]} {calYear}</span>
          <button
            onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++ } setCalMonth(m); setCalYear(y) }}
            className="w-8 h-8 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 flex items-center justify-center hover:border-cobalt-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-600 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {buildGrid().map((cell, i) => {
            if (!cell) return <div key={i} />
            return (
              <div key={i}
                onClick={e => {
                  if (cell.status === 'done' || cell.status === 'miss' || cell.status === 'today') {
                    setTooltip({ text: cell.status === 'miss' ? 'No steps logged' : `${cell.steps.toLocaleString()} steps`, x: e.clientX, y: e.clientY })
                    setTimeout(() => setTooltip(null), 1800)
                  }
                }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-bold cursor-pointer transition-transform active:scale-90 ${
                  cell.status === 'today' ? 'text-white shadow-lg shadow-cobalt-500/40'
                  : cell.status === 'done' ? 'text-cobalt-400'
                  : cell.status === 'miss' ? 'text-gray-600'
                  : 'text-gray-700'
                }`}
                style={{
                  background: cell.status === 'today' ? '#3b5bff'
                    : cell.status === 'done' ? 'rgba(59,91,255,0.15)'
                    : cell.status === 'miss' ? 'rgba(255,0,0,0.05)'
                    : cell.status === 'future' ? '#0d0d1a' : 'transparent',
                  border: cell.status === 'today' ? 'none'
                    : cell.status === 'done' ? '1px solid rgba(59,91,255,0.25)'
                    : cell.status === 'miss' ? '1px solid rgba(255,0,0,0.1)' : 'none',
                  animation: cell.status === 'today' ? 'calPulse 2s ease-in-out infinite' : undefined,
                }}
              >
                {cell.day}
                {(cell.status === 'done' || cell.status === 'today') && cell.steps > 0 && (
                  <span className={`text-[8px] mt-0.5 ${cell.status === 'today' ? 'text-white/70' : 'text-cobalt-500'}`}>
                    {fk(cell.steps)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { color: 'rgba(59,91,255,0.3)', border: 'rgba(59,91,255,0.4)', label: 'Steps logged' },
            { color: 'rgba(255,0,0,0.08)', border: 'rgba(255,0,0,0.2)', label: 'Missed' },
            { color: '#3b5bff', border: 'none', label: 'Today' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color, border: `1px solid ${l.border}` }} />
              <span className="text-[10px] text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-gray-800 border border-cobalt-500/30 rounded-lg px-3 py-2 text-xs text-white pointer-events-none shadow-xl"
          style={{ left: tooltip.x - 50, top: tooltip.y - 44 }}>
          {tooltip.text}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid #1e1e35' }}>
        {[
          { emoji: '🏠', label: 'Home', action: () => router.push('/dashboard'), active: false },
          { emoji: '🏆', label: 'Board', action: () => router.push('/dashboard'), active: false },
          { emoji: '📸', label: 'Submit', action: () => router.push('/submit'), active: false },
          { emoji: '🔥', label: 'Streak', action: () => router.push('/app/streak'), active: false },
          { emoji: '📅', label: 'Calendar', action: () => {}, active: true },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 pb-4 transition-opacity ${item.active ? 'opacity-100' : 'opacity-40'}`}>
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-cobalt-400">{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes calPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(59,91,255,0.5); }
          50% { box-shadow: 0 0 22px rgba(59,91,255,0.8); }
        }
      `}</style>
    </div>
  )
}
