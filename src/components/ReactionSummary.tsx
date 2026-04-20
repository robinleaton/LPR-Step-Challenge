'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  challengeId: string
}

export default function ReactionSummary({ userId, challengeId }: Props) {
  const [top, setTop] = useState<{ emoji: string; count: number }[]>([])
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [{ data: reactions }, { data: comments }] = await Promise.all([
        supabase.from('reactions').select('emoji').eq('to_user_id', userId).eq('challenge_id', challengeId),
        supabase.from('comments').select('id').eq('to_user_id', userId).eq('challenge_id', challengeId),
      ])

      if (reactions) {
        const counts: Record<string, number> = {}
        reactions.forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
        const sorted = Object.entries(counts)
          .map(([emoji, count]) => ({ emoji, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
        setTop(sorted)
      }
      setCommentCount(comments?.length || 0)
    }
    load()
  }, [userId, challengeId])

  if (top.length === 0 && commentCount === 0) return null

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
      {top.map(r => (
        <span key={r.emoji} className="flex items-center gap-0.5">
          <span>{r.emoji}</span>
          {r.count > 1 && <span className="text-[10px] font-bold">{r.count}</span>}
        </span>
      ))}
      {commentCount > 0 && (
        <span className="ml-1 flex items-center gap-0.5">
          <span>💬</span>
          <span className="text-[10px] font-bold">{commentCount}</span>
        </span>
      )}
    </div>
  )
}
