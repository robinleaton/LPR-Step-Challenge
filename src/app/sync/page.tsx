'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Activity, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SyncPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [todayLog, setTodayLog] = useState<any>(null)
  const [stravaConnected, setStravaConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const today = new Date().toISOString().split('T')[0]
      const { data: log } = await supabase.from('step_logs').select('*').eq('user_id', user.id).eq('date', today).single()
      if (log) { setTodayLog(log); setLastSync(log.created_at) }

      const { data: profile } = await supabase.from('profiles').select('strava_connected').eq('id', user.id).single()
      if (profile?.strava_connected) setStravaConnected(true)
    }
    init()
  }, [router])

  const connectStrava = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/api/auth/strava/callback`,
      response_type: 'code',
      scope: 'activity:read_all',
    })
    window.location.href = `https://www.strava.com/oauth/authorize?${params}`
  }

  const syncStrava = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync/strava', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json()
      if (data.steps !== undefined) {
        toast.success(`✅ Synced ${data.steps.toLocaleString()} steps from Strava!`)
        setTodayLog({ steps: data.steps, source: 'strava' })
        setLastSync(new Date().toISOString())
      } else {
        toast.error(data.message || 'Could not sync from Strava')
      }
    } catch {
      toast.error('Could not connect to Strava')
    }
    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-cobalt-500 hover:text-cobalt-400">← Back</button>
          <h1 className="text-xl font-bold dark:text-white">Sync Steps</h1>
        </div>

        {todayLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">Today synced!</p>
                <p className="text-sm text-gray-400">{todayLog.steps?.toLocaleString()} steps via {todayLog.source?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <span className="text-2xl">🏃</span>
            </div>
            <div>
              <h2 className="font-bold dark:text-white">Strava</h2>
              <p className="text-sm text-gray-400">Connect your Strava account to sync verified steps</p>
            </div>
          </div>

          {stravaConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Strava connected</p>
              </div>
              <button onClick={syncStrava} disabled={syncing} className="btn-primary w-full flex items-center justify-center gap-2">
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {syncing ? 'Syncing...' : 'Sync Steps from Strava'}
              </button>
              <p className="text-xs text-gray-400 text-center">Steps are pulled from your Strava activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={connectStrava} className="btn-primary w-full flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" />
                Connect Strava Account
              </button>
              <p className="text-xs text-gray-400 text-center">You will be redirected to Strava to authorise access. We only read your activity data.</p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400">
          Steps are synced daily. Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  )
}
