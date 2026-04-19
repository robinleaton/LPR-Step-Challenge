'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { X, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const REACTIONS = ['🔥', '💪', '👑', '😱', '🫡', '😂']

interface Props {
  target: {
    userId: string
    name: string
    steps: number
    avatar?: string
    stage?: string
  } | null
  challengeId: string
  currentUserId: string
  onClose: () => void
}

export default function ReactionSheet({ target, challengeId, currentUserId, onClose }: Props) {
  const [reactions, setReactions] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [stepHistory, setStepHistory] = useState<{ date: string; steps: number }[]>([])
  const [myReaction, setMyReaction] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const isSelf = target?.userId === currentUserId

  useEffect(() => {
    if (!target) return
    const load = async () => {
      setLoading(true)

      // Load reactions
      const { data: r } = await supabase
        .from('reactions')
        .select('*, profiles:from_user_id(full_name)')
        .eq('to_user_id', target.userId)
        .eq('challenge_id', challengeId)
      if (r) {
        setReactions(r)
        const mine = r.find((x: any) => x.from_user_id === currentUserId)
        setMyReaction(mine?.emoji || null)
      }

      // Load comments
      const { data: c } = await supabase
        .from('comments')
        .select('*, profiles:from_user_id(full_name)')
        .eq('to_user_id', target.userId)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (c) setComments(c)

      // Load last 7 days of steps
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const { data: logs } = await supabase
        .from('step_logs')
        .select('date, steps')
        .eq('user_id', target.userId)
        .gte('date', sevenDaysAgo.toLocaleDateString('en-CA'))
        .order('date', { ascending: true })
      if (logs) setStepHistory(logs)

      setLoading(false)
    }
    load()
  }, [target, challengeId, currentUserId])

  const sendReaction = async (emoji: string) => {
    if (!target || isSelf) return

    if (myReaction === emoji) {
      // Remove it
      await supabase
        .from('reactions')
        .delete()
        .eq('from_user_id', currentUserId)
        .eq('to_user_id', target.userId)
        .eq('challenge_id', challengeId)
        .eq('emoji', emoji)
      setMyReaction(null)
      setReactions(reactions.filter(r => !(r.from_user_id === currentUserId && r.emoji === emoji)))
      return
    }

    // Remove old reaction first
    if (myReaction) {
      await supabase
        .from('reactions')
        .delete()
        .eq('from_user_id', currentUserId)
        .eq('to_user_id', target.userId)
        .eq('challenge_id', challengeId)
    }

    // Insert new
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        from_user_id: currentUserId,
        to_user_id: target.userId,
        challenge_id: challengeId,
        emoji,
      })
      .select('*, profiles:from_user_id(full_name)')
      .single()

    if (!error && data) {
      setMyReaction(emoji)
      setReactions([...reactions.filter(r => r.from_user_id !== currentUserId), data])
    }
  }

  const sendComment = async () => {
    if (!target || !commentText.trim() || isSelf) return
    setSending(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        from_user_id: currentUserId,
        to_user_id: target.userId,
        challenge_id: challengeId,
        text: commentText.trim(),
      })
      .select('*, profiles:from_user_id(full_name)')
      .single()

    if (!error && data) {
      setComments([data, ...comments])
      setCommentText('')
      toast.success('Sent!')
    } else {
      toast.error('Could not send')
    }
    setSending(false)
  }

  // Group reactions by emoji
  const grouped = reactions.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = []
    acc[r.emoji].push(r)
    return acc
  }, {})

  const maxSteps = Math.max(...stepHistory.map(s => s.steps), 1)

  if (!target) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)',
            border: '1px solid rgba(59,91,255,0.15)',
            maxHeight: '85vh',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">{target.name}</h3>
              <p className="text-xs text-gray-400">
                {target.steps.toLocaleString()} steps
                {target.stage && ` · ${target.stage}`}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Step chart */}
            {stepHistory.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last 7 days</p>
                <div className="flex items-end gap-1.5 h-16">
                  {stepHistory.map((day, i) => {
                    const h = (day.steps / maxSteps) * 100
                    const label = new Date(day.date + 'T00:00:00').toLocaleDateString('en-NZ', { weekday: 'short' })[0]
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${Math.max(h, 4)}%`,
                            background: 'linear-gradient(180deg, #3b5bff, #7c3aed)',
                          }}
                        />
                        <span className="text-[9px] text-gray-600 font-bold">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reactions */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isSelf ? 'Reactions you got' : 'React'}
              </p>

              {!isSelf && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className={`text-2xl px-3 py-2 rounded-xl border transition-all ${
                        myReaction === emoji
                          ? 'border-cobalt-500 bg-cobalt-500/15 scale-110'
                          : 'border-gray-800 bg-white/5 hover:border-gray-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {Object.keys(grouped).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(grouped).map(([emoji, list]) => (
                    <div key={emoji} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                      <span>{emoji}</span>
                      <span className="text-xs text-gray-400">
                        {(list as any[]).map(r => r.profiles?.full_name?.split(' ')[0]).filter(Boolean).slice(0, 3).join(', ')}
                        {(list as any[]).length > 3 && ` +${(list as any[]).length - 3}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                !isSelf && <p className="text-xs text-gray-600 italic">Be the first to react</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Comments
              </p>

              {comments.length === 0 && (
                <p className="text-xs text-gray-600 italic mb-3">
                  {isSelf ? 'No comments yet' : 'No comments yet — say something 👇'}
                </p>
              )}

              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className="text-xs font-bold text-cobalt-400">
                        {c.profiles?.full_name || 'Someone'}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {new Date(c.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-300 leading-snug">{c.text}</p>
                  </div>
                ))}
              </div>

              {!isSelf && (
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    maxLength={140}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() }
                    }}
                    placeholder="Say something..."
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={sendComment}
                    disabled={sending || !commentText.trim()}
                    className="btn-primary px-4 py-2 flex items-center gap-1 text-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
              {commentText.length > 100 && (
                <p className="text-[10px] text-gray-600 text-right mt-1">{140 - commentText.length} left</p>
              )}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
