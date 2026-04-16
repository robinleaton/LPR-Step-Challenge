'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'

// Inner component that uses useSearchParams — must be inside Suspense
function CompleteSignupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Setting up your account...')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('No session found. Please try signing up again.')
      return
    }
    completeSignup()
  }, [sessionId])

  const completeSignup = async () => {
    try {
      setMessage('Verifying your payment...')

      const res = await fetch('/api/stripe/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please contact support.')
        return
      }

      setMessage('Logging you in...')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        // User may already be logged in — check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          setMessage('Welcome! Redirecting to your dashboard...')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }
        setStatus('error')
        setMessage('Account created but could not log in. Please go to the login page.')
        return
      }

      setStatus('success')
      setMessage('Welcome to LPR Step Challenge! 🎉')
      setTimeout(() => router.push('/dashboard'), 2000)

    } catch (err) {
      setStatus('error')
      setMessage('Something went wrong. Please contact support.')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm space-y-6"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h2 className="text-xl font-black dark:text-white mb-2">Almost there...</h2>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <div>
              <h2 className="text-xl font-black dark:text-white mb-2">You're in! 🎉</h2>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <div>
              <h2 className="text-xl font-black dark:text-white mb-2">Something went wrong</h2>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => router.push('/auth/login')} className="btn-primary w-full">
                Go to Login
              </button>
              <button onClick={() => router.push('/auth/signup')} className="btn-secondary w-full">
                Try signing up again
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// Loading fallback while Suspense resolves
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-lpr-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Setting up your account...</p>
      </div>
    </div>
  )
}

// Outer component wraps inner in Suspense — required by Next.js 14 for useSearchParams
export default function AuthCompletePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompleteSignupInner />
    </Suspense>
  )
}
