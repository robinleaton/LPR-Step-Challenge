'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { MaleAvatar } from '@/components/avatar/MaleAvatar'
import { FemaleAvatar } from '@/components/avatar/FemaleAvatar'
import toast from 'react-hot-toast'

export default function AuthCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'creating' | 'done' | 'error'>('loading')
  const [gender, setGender] = useState('male')

  useEffect(() => {
    const complete = async () => {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) { router.push('/auth/signup'); return }

      // Retrieve pending signup data
      const pendingRaw = sessionStorage.getItem('pendingSignup')
      if (!pendingRaw) { router.push('/auth/signup'); return }

      const pending = JSON.parse(pendingRaw)
      setGender(pending.gender || 'male')
      setStatus('creating')

      // Create the Supabase auth account
      const { data, error } = await supabase.auth.signUp({
        email: pending.email,
        password: pending.password,
        options: {
          data: {
            full_name: pending.fullName,
            gender: pending.gender,
            date_of_birth: pending.dateOfBirth,
          }
        }
      })

      if (error) {
        toast.error(error.message)
        setStatus('error')
        return
      }

      // Update profile with all details
      if (data.user) {
        await supabase.from('profiles').update({
          full_name: pending.fullName,
          gender: pending.gender,
          date_of_birth: pending.dateOfBirth,
          notification_email: pending.notificationEmail,
          notification_push: pending.notificationPush,
          subscription_status: 'trial',
          is_subscribed: true,
        }).eq('id', data.user.id)
      }

      sessionStorage.removeItem('pendingSignup')
      setStatus('done')

      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    }

    complete()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white dark:bg-lpr-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm"
      >
        {status === 'loading' || status === 'creating' ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-cobalt-500 border-t-transparent mx-auto"
            />
            <p className="dark:text-white font-medium">Setting up your account...</p>
          </>
        ) : status === 'done' ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {gender === 'female'
                ? <FemaleAvatar stage={1} size={160} animated />
                : <MaleAvatar stage={1} size={160} animated />
              }
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-2xl font-bold dark:text-white">Welcome to the Challenge! 🎉</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Your 14-day free trial has started. Time to get moving!
              </p>
              <div className="bg-cobalt-500/10 border border-cobalt-500/30 rounded-xl p-4 text-sm text-cobalt-400 mt-4">
                🛋️ You start as <strong>The Couch Potato</strong>. Walk 50,000 steps to evolve!
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-gray-400"
            >
              Taking you to your dashboard...
            </motion.div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-red-400">Something went wrong. Please try again.</p>
            <button onClick={() => router.push('/auth/signup')} className="btn-primary">
              Back to Signup
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
