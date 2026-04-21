'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Camera, CheckCircle, ArrowLeft, RefreshCw, Info, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubmitPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [todayLog, setTodayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [detectedSteps, setDetectedSteps] = useState<number | null>(null)
  const [confirmedSteps, setConfirmedSteps] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<{ title: string; start: string; end: string } | null>(null)
  const [challengeStatus, setChallengeStatus] = useState<'loading' | 'not_started' | 'active' | 'ended' | 'none'>('loading')
  const [nextChallenge, setNextChallenge] = useState<{ title: string; start: string } | null>(null)

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

  const now = new Date()
  const cutoff = new Date()
  cutoff.setHours(23, 59, 0, 0)
  const isPastCutoff = now > cutoff

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      // Check today's existing log
      const { data } = await supabase
        .from('step_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      if (data) setTodayLog(data)

      // Get all challenges user is enrolled in
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenges(id, title, start_date, end_date, is_active)')
        .eq('user_id', user.id)

      const allChallenges = (participations || [])
        .map((p: any) => p.challenges)
        .filter(Boolean)
        .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))

      if (allChallenges.length === 0) {
        setChallengeStatus('none')
        setLoading(false)
        return
      }

      // Find active challenge today
      const active = allChallenges.find((c: any) =>
        today >= c.start_date && today <= c.end_date && c.is_active
      )

      if (active) {
        setChallengeStatus('active')
        setActiveChallenge({ title: active.title, start: active.start_date, end: active.end_date })
        setLoading(false)
        return
      }

      // Check if a challenge hasn't started yet
      const upcoming = allChallenges.find((c: any) => today < c.start_date)
      if (upcoming) {
        setChallengeStatus('not_started')
        setNextChallenge({ title: upcoming.title, start: upcoming.start_date })
        setLoading(false)
        return
      }

      // All challenges have ended
      setChallengeStatus('ended')
      setLoading(false)
    }
    init()
  }, [router])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setDetectedSteps(null)
    setConfirmedSteps('')
    setAnalyzing(true)
    try {
      const base64 = await fileToBase64(file)
      const response = await fetch('/api/sync/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      })
      const data = await response.json()
      if (data.steps) {
        setDetectedSteps(data.steps)
        setConfirmedSteps(data.steps.toString())
        toast.success(`We detected ${data.steps.toLocaleString()} steps!`)
      } else {
        toast('Could not read steps automatically — please enter them manually.')
        setConfirmedSteps('')
      }
    } catch {
      toast.error('Could not analyse photo. Please enter steps manually.')
    }
    setAnalyzing(false)
  }

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleSubmit = async () => {
    const steps = parseInt(confirmedSteps)
    if (isNaN(steps) || steps < 0) { toast.error('Please enter a valid step count'); return }
    if (!photoFile) { toast.error('Please upload a photo of your steps'); return }

    setUploading(true)
    try {
      let photoUrl = null
      const ext = photoFile.name.split('.').pop()
      const fileName = `${user.id}/${today}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('step-photos')
        .upload(fileName, photoFile, { upsert: true })
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('step-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('step_logs').upsert({
        user_id: user.id,
        steps,
        date: today,
        source: 'photo',
        photo_url: photoUrl,
      }, { onConflict: 'user_id,date' })

      if (!error) {
        toast.success(`✅ ${steps.toLocaleString()} steps submitted!`)
        setTodayLog({ steps, source: 'photo', photo_url: photoUrl })
        setSubmitted(true)
      } else {
        toast.error('Failed to save steps. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setUploading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-cobalt-500 hover:text-cobalt-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">Log Today's Steps</h1>
        </div>

        {/* ── CHALLENGE NOT STARTED YET ── */}
        {challengeStatus === 'not_started' && nextChallenge && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-center space-y-3"
            style={{ background: 'linear-gradient(135deg, #0d1233, #0a0a1a)', border: '1px solid rgba(59,91,255,0.3)' }}>
            <div className="text-4xl">⏳</div>
            <h2 className="text-lg font-black dark:text-white">{nextChallenge.title}</h2>
            <p className="text-sm text-gray-400">
              The challenge hasn't started yet.<br />
              Submissions open on <strong className="text-cobalt-400">{nextChallenge.start}</strong>.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-cobalt-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Step logging is locked until the challenge begins</span>
            </div>
            <button onClick={() => router.push('/dashboard')} className="btn-secondary mx-auto mt-2">
              Back to Dashboard
            </button>
          </motion.div>
        )}

        {/* ── CHALLENGE ENDED ── */}
        {challengeStatus === 'ended' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-center space-y-3"
            style={{ background: 'linear-gradient(135deg, #1a0a0a, #130d0d)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="text-4xl">🏁</div>
            <h2 className="text-lg font-black dark:text-white">Challenge Finished!</h2>
            <p className="text-sm text-gray-400">
              The challenge has ended. Results are final — great effort everyone!
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Step logging is now closed</span>
            </div>
            <button onClick={() => router.push('/dashboard')} className="btn-primary mx-auto mt-2">
              View Final Leaderboard
            </button>
          </motion.div>
        )}

        {/* ── NO CHALLENGE ── */}
        {challengeStatus === 'none' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-center space-y-3"
            style={{ background: 'linear-gradient(135deg, #0d0d1a, #111120)', border: '1px solid rgba(107,114,128,0.3)' }}>
            <div className="text-4xl">🤔</div>
            <h2 className="text-lg font-black dark:text-white">No Active Challenge</h2>
            <p className="text-sm text-gray-400">You're not enrolled in any challenge yet.</p>
            <button onClick={() => router.push('/dashboard')} className="btn-secondary mx-auto mt-2">
              Back to Dashboard
            </button>
          </motion.div>
        )}

        {/* ── ACTIVE CHALLENGE — show submit form ── */}
        {challengeStatus === 'active' && (
          <>
            {/* One per day notice */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'linear-gradient(135deg, #0b1430, #13131f)', border: '1px solid rgba(59,91,255,0.25)' }}>
              <Info className="w-4 h-4 text-cobalt-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-cobalt-400">One submission per day</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload a screenshot of your step count. You can only log once per day — make sure it shows today's full count.
                </p>
              </div>
            </div>

            {/* Cutoff warning */}
            <div className="card bg-amber-500/10 border-amber-500/30">
              <p className="text-sm text-amber-500">
                ⏰ Must be submitted before <strong>11:59pm tonight</strong> to count.
              </p>
            </div>

            {/* Challenge banner */}
            {activeChallenge && (
              <div className="card bg-cobalt-500/10 border-cobalt-500/30">
                <p className="text-sm text-cobalt-400">
                  🏆 <strong>{activeChallenge.title}</strong> — your steps count toward the leaderboard.
                </p>
              </div>
            )}

            {/* Past cutoff */}
            {isPastCutoff && (
              <div className="card bg-red-500/10 border-red-500/30 text-center py-8 space-y-2">
                <p className="text-2xl">🚫</p>
                <h2 className="font-bold text-red-400">Submissions Closed for Today</h2>
                <p className="text-sm text-gray-400">Today's window has closed. Come back tomorrow!</p>
              </div>
            )}

            {/* Already submitted */}
            {!isPastCutoff && (todayLog || submitted) && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="px-5 py-5 text-center"
                  style={{ background: 'linear-gradient(135deg, #0a1a0a, #0d1a0d)' }}>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h2 className="font-black text-green-400 text-xl mb-1">Today's steps logged! ✅</h2>
                  <div className="text-4xl font-black dark:text-white my-2">
                    {(todayLog?.steps || parseInt(confirmedSteps) || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400">steps recorded today</p>
                </div>
                <div className="px-5 py-4 space-y-3"
                  style={{ background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>You can only log steps once per day. Come back tomorrow to log again.</span>
                  </div>
                  {todayLog?.photo_url && (
                    <a href={todayLog.photo_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-cobalt-400 hover:text-cobalt-300">
                      📷 View your submitted photo
                    </a>
                  )}
                  <button onClick={() => router.push('/dashboard')} className="btn-primary w-full mt-1">
                    View Leaderboard →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Upload form */}
            {!isPastCutoff && !todayLog && !submitted && (
              <div className="space-y-4">
                <div className="card space-y-4">
                  <h2 className="font-bold dark:text-white">📸 Upload Your Step Photo</h2>
                  <input ref={fileRef} type="file" accept="image/*"
                    className="hidden" onChange={handlePhotoSelect} />
                  {!preview ? (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-cobalt-500 transition-colors">
                      <Camera className="w-10 h-10 text-gray-400" />
                      <p className="font-medium dark:text-white">Tap to upload photo</p>
                      <p className="text-xs text-gray-400 text-center">Choose from gallery or take a photo</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden">
                        <img src={preview} alt="Step count photo" className="w-full object-cover max-h-64" />
                        {analyzing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 text-white animate-spin" />
                            <span className="text-white font-medium">Reading steps...</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => { setPreview(null); setPhotoFile(null); setDetectedSteps(null); setConfirmedSteps('') }}
                        className="text-sm text-cobalt-400 hover:text-cobalt-300">
                        Choose a different photo
                      </button>
                    </div>
                  )}
                </div>

                {(preview && !analyzing) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
                    <div>
                      <label className="label">
                        {detectedSteps ? '✅ Steps detected — confirm or correct:' : 'Enter your step count manually:'}
                      </label>
                      <input type="number" value={confirmedSteps}
                        onChange={e => setConfirmedSteps(e.target.value)}
                        placeholder="e.g. 8432" className="input" min="0" max="100000" />
                      {detectedSteps && (
                        <p className="text-xs text-green-500 mt-1">
                          AI detected {detectedSteps.toLocaleString()} steps. You can correct this if needed.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900 rounded-xl px-3 py-2.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 text-cobalt-400" />
                      <span>This is your <strong className="text-gray-300">one submission for today</strong> — make sure the count is correct before confirming.</span>
                    </div>
                    <button onClick={handleSubmit} disabled={uploading || !confirmedSteps}
                      className="btn-primary w-full flex items-center justify-center gap-2">
                      {uploading
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                        : '✅ Confirm & Submit Steps'}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
