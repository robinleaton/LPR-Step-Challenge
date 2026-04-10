'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Smartphone, Activity, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SyncPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingSource, setSyncingSource] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown')
  const [manualSteps, setManualSteps] = useState('')
  const [todayLog, setTodayLog] = useState<any>(null)
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const ua = navigator.userAgent
      if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios')
      else if (/Android/.test(ua)) { setPlatform('android'); checkHealthConnectAvailability() }
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('step_logs').select('*').eq('user_id', user.id).eq('date', today).single()
      if (data) { setTodayLog(data); setLastSync(data.created_at) }
    }
    init()
  }, [router])

  const checkHealthConnectAvailability = () => {
    const ua = navigator.userAgent
    const m = ua.match(/Android (\d+)/)
    if (m && parseInt(m[1]) >= 9) setHealthConnectAvailable(true)
  }

  const syncAppleHealth = async () => {
    setSyncing(true); setSyncingSource('apple_health')
    try {
      if ('health' in navigator) {
        toast('Requesting Apple Health access...')
        const health = (navigator as any).health
        const result = await health.query({ startDate: new Date(Date.now() - 7*24*60*60*1000), endDate: new Date(), type: 'steps' })
        await saveSteps(result.totalSteps || 0, 'apple_health')
      } else {
        toast('Please use the iOS Shortcuts app to sync — see instructions below', { duration: 6000 })
        setSyncing(false); setSyncingSource(null); return
      }
    } catch { toast.error('Could not access Apple Health. Please check permissions.') }
    setSyncing(false); setSyncingSource(null)
  }

  const syncGoogleFit = async () => {
    setSyncing(true); setSyncingSource('google_fit')
    try {
      const response = await fetch('/api/sync/google-fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
      const data = await response.json()
      if (data.steps !== undefined) await saveSteps(data.steps, 'google_fit')
      else toast('Connect Google Fit in settings first')
    } catch { toast.error('Could not sync Google Fit') }
    setSyncing(false); setSyncingSource(null)
  }

  const syncSamsungHealth = async () => {
    setSyncing(true); setSyncingSource('samsung_health')
    try {
      const response = await fetch('/api/sync/health-connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
      const data = await response.json()
      if (response.ok && data.steps !== undefined) await saveSteps(data.steps, 'samsung_health')
      else if (data.error === 'not_connected') toast('Open Samsung Health > Settings > Health Connect > Allow All, then try again.', { duration: 8000 })
      else toast.error(data.message || 'Could not sync Samsung Health')
    } catch { toast.error('Could not connect to Samsung Health') }
    setSyncing(false); setSyncingSource(null)
  }

  const saveSteps = async (steps: number, source: string) => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('step_logs').upsert({ user_id: user.id, steps, date: today, source }, { onConflict: 'user_id,date' })
    if (!error) { toast.success(`✅ Synced ${steps.toLocaleString()} steps!`); setLastSync(new Date().toISOString()); setTodayLog({ steps, source }) }
    else toast.error('Failed to save steps')
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const steps = parseInt(manualSteps)
    if (isNaN(steps) || steps < 0) { toast.error('Invalid step count'); return }
    await saveSteps(steps, 'manual'); setManualSteps('')
  }

  const isSyncing = (source: string) => syncing && syncingSource === source

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
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center"><span className="text-2xl">🍎</span></div>
            <div><h2 className="font-bold dark:text-white">Apple Health</h2><p className="text-sm text-gray-400">iPhone / Apple Watch</p></div>
          </div>
          {platform === 'ios' ? (
            <button onClick={syncAppleHealth} disabled={syncing} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSyncing('apple_health') ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isSyncing('apple_health') ? 'Syncing...' : 'Sync from Apple Health'}
            </button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /><p className="text-sm font-medium text-amber-500">Open on iPhone</p></div>
              <p className="text-xs text-gray-400">Apple Health sync requires opening this app in Safari on your iPhone. Visit <strong>leatonperformance.co.nz/step-challenge</strong> on your iPhone.</p>
            </div>
          )}
        </div>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center"><span className="text-2xl">🤖</span></div>
            <div><h2 className="font-bold dark:text-white">Google Fit</h2><p className="text-sm text-gray-400">Android / Wear OS</p></div>
          </div>
          {platform === 'android' ? (
            <button onClick={syncGoogleFit} disabled={syncing} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSyncing('google_fit') ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isSyncing('google_fit') ? 'Syncing...' : 'Sync from Google Fit'}
            </button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /><p className="text-sm font-medium text-amber-500">Open on Android</p></div>
              <p className="text-xs text-gray-400">Google Fit sync requires opening this app on your Android device.</p>
            </div>
          )}
        </div>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center"><span className="text-2xl">💜</span></div>
            <div><h2 className="font-bold dark:text-white">Samsung Health</h2><p className="text-sm text-gray-400">Android / Galaxy Watch</p></div>
          </div>
          {platform === 'android' ? (
            <div className="space-y-3">
              <button onClick={syncSamsungHealth} disabled={syncing} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSyncing('samsung_health') ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {isSyncing('samsung_health') ? 'Syncing...' : 'Sync from Samsung Health'}
              </button>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-400">💡 First time? Open <strong>Samsung Health → Settings → Health Connect → Allow All</strong>, then tap sync above.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /><p className="text-sm font-medium text-amber-500">Open on Android</p></div>
              <p className="text-xs text-gray-400">Samsung Health sync requires opening this app on your Android device.</p>
            </div>
          )}
        </div>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cobalt-500/10 flex items-center justify-center"><Smartphone className="w-6 h-6 text-cobalt-500" /></div>
            <div><h2 className="font-bold dark:text-white">Enter Steps Manually</h2><p className="text-sm text-gray-400">Only if device sync isn't available</p></div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-xs text-amber-500">⚠️ Manual entries cannot be verified and may be excluded from prize eligibility at the admin's discretion.</p>
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input type="number" value={manualSteps} onChange={e => setManualSteps(e.target.value)} placeholder="e.g. 8432" className="input flex-1" min="0" max="100000" />
            <button type="submit" className="btn-primary px-4">Save</button>
          </form>
        </div>
        <p className="text-xs text-center text-gray-400">Steps are synced daily. Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  )
}
