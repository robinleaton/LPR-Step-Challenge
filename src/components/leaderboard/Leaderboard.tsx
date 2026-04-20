'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { MaleAvatar } from '@/components/avatar/MaleAvatar'
import { FemaleAvatar } from '@/components/avatar/FemaleAvatar'
import { formatSteps, getAvatarStage, AGE_BRACKETS, getAge } from '@/lib/constants'
import { Trophy, Filter, Crown, Medal } from 'lucide-react'
import ReactionSheet from '@/components/ReactionSheet'
import ReactionSummary from '@/components/ReactionSummary'

interface LeaderboardEntry {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  total_steps: number
  is_subscribed: boolean
  subscription_status: string
}

interface LeaderboardProps {
  currentUserId?: string
  showFilters?: boolean
}

export function Leaderboard({ currentUserId, showFilters = true }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [showTop, setShowTop] = useState(10)
  const [challengeDates, setChallengeDates] = useState<{ start: string, end: string, title: string } | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [mode, setMode] = useState<'challenge' | 'subscriber'>('challenge')

  // Reaction sheet state
  const [reactionTarget, setReactionTarget] = useState<{
    userId: string
    name: string
    steps: number
    stage?: string
  } | null>(null)

  const fetchLeaderboard = async () => {
    if (!currentUserId) { setLoading(false); return }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

    const { data: participations } = await supabase
      .from('challenge_participants')
      .select('challenge_id, challenges(id, title, start_date, end_date)')
      .eq('user_id', currentUserId)

    let challenge: any = null
    if (participations && participations.length > 0) {
      for (const p of participations) {
        const c = p.challenges as any
        if (c && today >= c.start_date && today <= c.end_date) { challenge = c; break }
      }
      if (!challenge) {
        const sorted = participations
          .map((p: any) => p.challenges)
          .filter(Boolean)
          .sort((a: any, b: any) => b.start_date.localeCompare(a.start_date))
        challenge = sorted[0]
      }
    }

    if (challenge) {
      setMode('challenge')
      setChallengeDates({ start: challenge.start_date, end: challenge.end_date, title: challenge.title })
      setChallengeId(challenge.id)

      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id, profiles(id, full_name, gender, date_of_birth, is_subscribed, subscription_status)')
        .eq('challenge_id', challenge.id)

      if (!participants || participants.length === 0) { setEntries([]); setLoading(false); return }

      const userIds = participants.map((p: any) => p.user_id)
      const { data: stepLogs } = await supabase
        .from('step_logs')
        .select('user_id, steps')
        .in('user_id', userIds)
        .gte('date', challenge.start_date)
        .lte('date', challenge.end_date)

      const stepsByUser: Record<string, number> = {}
      userIds.forEach((id: string) => { stepsByUser[id] = 0 })
      stepLogs?.forEach((log: any) => { stepsByUser[log.user_id] = (stepsByUser[log.user_id] || 0) + log.steps })

      let result: LeaderboardEntry[] = participants.map((p: any) => ({
        id: p.profiles?.id || p.user_id,
        full_name: p.profiles?.full_name || 'Anonymous',
        gender: p.profiles?.gender || 'male',
        date_of_birth: p.profiles?.date_of_birth || '',
        is_subscribed: p.profiles?.is_subscribed || false,
        subscription_status: p.profiles?.subscription_status || '',
        total_steps: stepsByUser[p.user_id] || 0,
      }))

      if (genderFilter !== 'all') result = result.filter(e => e.gender === genderFilter)
      if (ageFilter !== 'all') {
        const bracket = AGE_BRACKETS.find(b => b.label === ageFilter)
        if (bracket) result = result.filter(e => {
          const age = e.date_of_birth ? getAge(e.date_of_birth) : 0
          return age >= bracket.min && age <= bracket.max
        })
      }
      result.sort((a, b) => b.total_steps - a.total_steps)
      setEntries(result)
      setLoading(false)
      return
    }

    // Subscriber fallback
    setMode('subscriber')
    setChallengeDates(null)
    setChallengeId(null)

    const { data: subscribers } = await supabase
      .from('profiles')
      .select('id, full_name, gender, date_of_birth, total_steps, is_subscribed, subscription_status')
      .in('subscription_status', ['active', 'trial'])
      .order('total_steps', { ascending: false })

    if (!subscribers || subscribers.length === 0) { setEntries([]); setLoading(false); return }

    let result: LeaderboardEntry[] = subscribers.map((s: any) => ({
      id: s.id,
      full_name: s.full_name || 'Anonymous',
      gender: s.gender || 'male',
      date_of_birth: s.date_of_birth || '',
      is_subscribed: s.is_subscribed || false,
      subscription_status: s.subscription_status || '',
      total_steps: s.total_steps || 0,
    }))

    if (genderFilter !== 'all') result = result.filter(e => e.gender === genderFilter)
    if (ageFilter !== 'all') {
      const bracket = AGE_BRACKETS.find(b => b.label === ageFilter)
      if (bracket) result = result.filter(e => {
        const age = e.date_of_birth ? getAge(e.date_of_birth) : 0
        return age >= bracket.min && age <= bracket.max
      })
    }
    result.sort((a, b) => b.total_steps - a.total_steps)
    setEntries(result)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard()
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'step_logs' }, () => fetchLeaderboard())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [genderFilter, ageFilter, currentUserId])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-bold text-gray-400 w-5 text-center">{rank}</span>
  }

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-cobalt-500/20 border border-cobalt-500/50'
    if (rank === 1) return 'bg-yellow-500/10 border border-yellow-500/30'
    if (rank === 2) return 'bg-gray-300/10 border border-gray-300/20'
    if (rank === 3) return 'bg-amber-600/10 border border-amber-600/20'
    return 'bg-white/5 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/50'
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-cobalt-500" />
          <h2 className="text-xl font-bold dark:text-white">Live Leaderboard</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* Context label */}
      {mode === 'challenge' && challengeDates && (
        <p className="text-xs text-gray-400">
          {challengeDates.title} · {challengeDates.start} to {challengeDates.end}
        </p>
      )}
      {mode === 'subscriber' && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">All members · lifetime steps</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cobalt-500/20 text-cobalt-400 border border-cobalt-500/30">
            No active challenge
          </span>
        </div>
      )}

      {/* Tap hint */}
      {mode === 'challenge' && challengeId && (
        <p className="text-xs text-gray-500">💬 Tap any row to react or comment</p>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Filter:</span>
          </div>
          <div className="flex gap-1">
            {['all', 'male', 'female'].map(g => (
              <button key={g} onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  genderFilter === g ? 'bg-cobalt-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                {g === 'all' ? 'All' : g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
          <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
            className="px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none outline-none">
            <option value="all">All Ages</option>
            {AGE_BRACKETS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
          </select>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No steps logged yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {entries.slice(0, showTop).map((entry, index) => {
              const isCurrentUser = entry.id === currentUserId
              const rank = index + 1
              const stage = getAvatarStage(entry.total_steps)
              const isTappable = mode === 'challenge' && !!challengeId

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (isTappable) {
                      setReactionTarget({
                        userId: entry.id,
                        name: entry.full_name || 'Anonymous',
                        steps: entry.total_steps,
                        stage: stage.name,
                      })
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${getRankBg(rank, isCurrentUser)} ${isTappable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                >
                  <div className="flex items-center justify-center w-8">{getRankIcon(rank)}</div>

                  <div className="flex-shrink-0">
                    {entry.gender === 'female'
                      ? <FemaleAvatar stage={stage.stage} size={44} animated={false} />
                      : <MaleAvatar stage={stage.stage} size={44} animated={false} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate text-sm ${isCurrentUser ? 'text-cobalt-400' : 'dark:text-white'}`}>
                        {entry.full_name || 'Anonymous'}
                        {isCurrentUser && <span className="ml-1 text-xs text-cobalt-400">(you)</span>}
                      </p>
                      {entry.is_subscribed && (
                        <span className="flex-shrink-0 text-xs bg-cobalt-500/20 text-cobalt-400 px-1.5 py-0.5 rounded-full">
                          Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{stage.name}</p>

                    {/* Reaction emoji summary */}
                    {isTappable && challengeId && (
                      <ReactionSummary userId={entry.id} challengeId={challengeId} />
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm dark:text-white">{formatSteps(entry.total_steps)}</p>
                    <p className="text-xs text-gray-400">steps</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {entries.length > showTop && (
            <button onClick={() => setShowTop(p => p + 10)}
              className="w-full py-2 text-sm text-cobalt-500 hover:text-cobalt-400 transition-colors">
              Show more ({entries.length - showTop} remaining)
            </button>
          )}
        </div>
      )}

      {/* Reaction sheet — mounts once, slides up when a row is tapped */}
      {currentUserId && challengeId && (
        <ReactionSheet
          target={reactionTarget}
          challengeId={challengeId}
          currentUserId={currentUserId}
          onClose={() => setReactionTarget(null)}
        />
      )}

    </div>
  )
}
