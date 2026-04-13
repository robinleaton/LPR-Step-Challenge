'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Camera, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
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

  const now = new Date()
  const cutoff = new Date()
  cutoff.setHours(23, 59, 0, 0)
  const isPastCutoff = now > cutoff

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('step_logs').select('*').eq('user_id', user.id).eq('date', today).single()
      if (data) setTodayLog(data)
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
    // Block submissions outside challenge window
const today = new Date().toISOString().split('T')[0]
const { data: participation } = await supabase
  .from('challenge_participants')
  .select('challenges(start_date, end_date)')
  .eq('user_id', user.id)
  .single()
if (participation?.challenges) {
  const ch = participation.challenges as any
  if (today < ch.start_date) {
    toast.error(`Challenge hasn't started yet — submissions open on ${ch.start_date}`)
    return
  }
  if (today > ch.end_date) {
    toast.error('This challenge has ended.')
    return
  }
}
    setUploading(true)
    try {
      let photoUrl = null
      const ext = photoFile.name.split('.').pop()
      const fileName = `${user.id}/${new Date().toISOString().split('T')[0]}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('step-photos').upload(fileName, photoFile, { upsert: true })
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('step-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('step_logs').upsert({
        user_id: user.id, steps, date: today, source: 'photo', photo_url: photoUrl,
      }, { onConflict: 'user_id,date' })
      if (!error) {
        toast.success(`✅ ${steps.toLocaleString()} steps submitted!`)
        setTodayLog({ steps, source: 'photo', photo_url: photoUrl })
        setSubmitted(true)
      } else {
        toast.error('Failed to save steps. Please try again.')
      }
    } catch { toast.error('Something went wrong. Please try again.') }
    setUploading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-lpr-black">
      <div className="w-10 h-10 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-cobalt-500 hover:text-cobalt-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold dark:text-white">Submit Today's Steps</h1>
        </div>

        <div className="card bg-amber-500/10 border-amber-500/30">
          <p className="text-sm text-amber-500">⏰ Steps must be submitted before <strong>11:59pm today</strong> or they cannot be counted.</p>
        </div>
        
        {isPastCutoff && (
          <div className="card bg-red-500/10 border-red-500/30 text-center py-8 space-y-2">
            <p className="text-2xl">🚫</p>
            <h2 className="font-bold text-red-400">Submissions Closed</h2>
            <p className="text-sm text-gray-400">Today's submission window has closed. Come back tomorrow!</p>
          </div>
        )}

        {!isPastCutoff && (todayLog || submitted) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card bg-green-500/10 border-green-500/30 text-center py-8 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="font-bold text-green-500 text-xl">Steps Submitted!</h2>
            <p className="text-2xl font-bold dark:text-white">{(todayLog?.steps || parseInt(confirmedSteps) || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-400">Today's steps have been logged. See you tomorrow!</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary mx-auto">View Leaderboard</button>
          </motion.div>
        )}

        {!isPastCutoff && !todayLog && !submitted && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-bold dark:text-white">📸 Upload Your Step Photo</h2>
              <p className="text-sm text-gray-400">Take a screenshot of your Samsung Health, Apple Health, or fitness app showing your step count for today.</p>

              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />

              {!preview ? (
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-cobalt-500 transition-colors">
                  <Camera className="w-10 h-10 text-gray-400" />
                  <p className="font-medium dark:text-white">Tap to upload photo</p>
                  <p className="text-xs text-gray-400">Take a photo or choose from gallery</p>
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
                  <button onClick={() => { setPreview(null); setPhotoFile(null); setDetectedSteps(null); setConfirmedSteps('') }} className="text-sm text-cobalt-400 hover:text-cobalt-300">Choose different photo</button>
                </div>
              )}
            </div>

            {(preview && !analyzing) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
                <div>
                  <label className="label">
                    {detectedSteps ? '✅ Steps detected — confirm or correct:' : 'Enter your step count manually:'}
                  </label>
                  <input
                    type="number"
                    value={confirmedSteps}
                    onChange={e => setConfirmedSteps(e.target.value)}
                    placeholder="e.g. 8432"
                    className="input"
                    min="0"
                    max="100000"
                  />
                  {detectedSteps && (
                    <p className="text-xs text-green-500 mt-1">AI detected {detectedSteps.toLocaleString()} steps from your photo. You can correct this if needed.</p>
                  )}
                </div>
                <button onClick={handleSubmit} disabled={uploading || !confirmedSteps} className="btn-primary w-full flex items-center justify-center gap-2">
                  {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</> : '✅ Confirm & Submit Steps'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
