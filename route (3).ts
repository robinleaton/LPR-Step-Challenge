'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { MaleAvatar } from '@/components/avatar/MaleAvatar'
import { FemaleAvatar } from '@/components/avatar/FemaleAvatar'
import { formatSteps, getAvatarStage, AGE_BRACKETS, getAge } from '@/lib/constants'
import { Trophy, Filter, Crown, Medal } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  avatar_stage: number
  total_steps: number
  is_subscribed: boolean
  subscription_status: string
  overall_rank: number
  age: number
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

  const fetchLeaderboard = async () => {
    let query = supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_steps', { ascending: false })
      .limit(100)

    if (genderFilter !== 'all') {
      query = query.eq('gender', genderFilter)
    }

    const { data, error } = await query
    if (!error && data) {
      let filtered = data
      if (ageFilter !== 'all') {
        const bracket = AGE_BRACKETS.find(b => b.label === ageFilter)
        if (bracket) {
          filtered = data.filter(e => {
            const age = e.age || (e.date_of_birth ? getAge(e.date_of_birth) : 0)
            return age >= bracket.min && age <= bracket.max
          })
        }
      }
      setEntries(filtered)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard()

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
      }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [genderFilter, ageFilter])

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

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Filter:</span>
          </div>
          {/* Gender filter */}
          <div className="flex gap-1">
            {['all', 'male', 'female'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  genderFilter === g
                    ? 'bg-cobalt-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {g === 'all' ? 'All' : g === 'male' ? '👨 Male' : '👩 Female'}
              </button>
            ))}
          </div>
          {/* Age filter */}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none outline-none"
          >
            <option value="all">All Ages</option>
            {AGE_BRACKETS.map(b => (
              <option key={b.label} value={b.label}>{b.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No entries yet. Be the first on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {entries.slice(0, showTop).map((entry, index) => {
              const isCurrentUser = entry.id === currentUserId
              const rank = index + 1
              const stage = getAvatarStage(entry.total_steps)

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${getRankBg(rank, isCurrentUser)}`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(rank)}
                  </div>

                  {/* Mini avatar */}
                  <div className="flex-shrink-0">
                    {entry.gender === 'female' ? (
                      <FemaleAvatar stage={stage.stage} size={44} animated={false} />
                    ) : (
                      <MaleAvatar stage={stage.stage} size={44} animated={false} />
                    )}
                  </div>

                  {/* Name & info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate text-sm ${isCurrentUser ? 'text-cobalt-400' : 'dark:text-white'}`}>
                        {entry.full_name || 'Anonymous'}
                        {isCurrentUser && <span className="ml-1 text-xs text-cobalt-400">(you)</span>}
                      </p>
                      {entry.is_subscribed && (
                        <span className="flex-shrink-0 text-xs bg-cobalt-500/20 text-cobalt-400 px-1.5 py-0.5 rounded-full">
                          ✓ Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{stage.name}</p>
                  </div>

                  {/* Steps */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm dark:text-white">{formatSteps(entry.total_steps)}</p>
                    <p className="text-xs text-gray-400">steps</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Show more */}
          {entries.length > showTop && (
            <button
              onClick={() => setShowTop(prev => prev + 10)}
              className="w-full py-2 text-sm text-cobalt-500 hover:text-cobalt-400 transition-colors"
            >
              Show more ({entries.length - showTop} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
