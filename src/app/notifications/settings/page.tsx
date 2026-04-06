'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Mail, Smartphone, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({ notification_email: true, notification_push: true })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setPrefs({ notification_email: data.notification_email, notification_push: data.notification_push })
      }
      setLoading(false)
    }
    init()
  }, [router])

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported on this device')
      return false
    }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      toast.error('Permission denied for push notifications')
      return false
    }
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    if (prefs.notification_push) {
      const granted = await requestPushPermission()
      if (!granted) {
        setPrefs(p => ({ ...p, notification_push: false }))
        setSaving(false)
        return
      }
    }
    const { error } = await supabase
      .from('profiles')
      .update({ notification_email: prefs.notification_email, notification_push: prefs.notification_push })
      .eq('id', profile.id)
    if (!error) toast.success('Notification preferences saved!')
    else toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black"><div className="w-8 h-8 border-2 border-cobalt-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-cobalt-500 hover:text-cobalt-400 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-cobalt-500" />
          <h1 className="text-xl font-bold dark:text-white">Notification Settings</h1>
        </div>

        <div className="card space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how you want to be notified about step reminders, leaderboard updates, and challenge news.
          </p>

          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-cobalt-500" />
              <div>
                <p className="font-medium dark:text-white">Email Notifications</p>
                <p className="text-xs text-gray-400">Daily reminders, challenge updates, prize wins</p>
              </div>
            </div>
            <button
              onClick={() => setPrefs(p => ({ ...p, notification_email: !p.notification_email }))}
              className={`relative w-12 h-6 rounded-full transition-all ${prefs.notification_email ? 'bg-cobalt-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.notification_email ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cobalt-500" />
              <div>
                <p className="font-medium dark:text-white">Push Notifications</p>
                <p className="text-xs text-gray-400">Instant alerts on your device</p>
              </div>
            </div>
            <button
              onClick={() => setPrefs(p => ({ ...p, notification_push: !p.notification_push }))}
              className={`relative w-12 h-6 rounded-full transition-all ${prefs.notification_push ? 'bg-cobalt-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.notification_push ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* What you'll get */}
          <div className="space-y-2">
            <p className="text-sm font-medium dark:text-white">You'll be notified about:</p>
            {[
              '📊 Daily step sync reminders',
              '🏆 Leaderboard position changes',
              '⚔️ New challenge announcements',
              '🎉 Avatar evolution milestones',
              '💰 Prize win notifications',
              '⏰ Challenge ending soon (3 days, 1 day)',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
