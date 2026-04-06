'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { MaleAvatar } from './MaleAvatar'
import { FemaleAvatar } from './FemaleAvatar'
import { getAvatarStage, getNextStage, getProgressToNextStage, formatSteps } from '@/lib/constants'
import { useState, useEffect } from 'react'

interface AvatarDisplayProps {
  gender: 'male' | 'female' | 'prefer_not_to_say'
  totalSteps: number
  size?: number
  showInfo?: boolean
  previousSteps?: number
}

export function AvatarDisplay({ gender, totalSteps, size = 180, showInfo = true, previousSteps }: AvatarDisplayProps) {
  const [isEvolving, setIsEvolving] = useState(false)
  const currentStage = getAvatarStage(totalSteps)
  const nextStage = getNextStage(totalSteps)
  const progress = getProgressToNextStage(totalSteps)

  // Detect stage evolution
  useEffect(() => {
    if (previousSteps !== undefined) {
      const prevStage = getAvatarStage(previousSteps)
      if (prevStage.stage !== currentStage.stage) {
        setIsEvolving(true)
        setTimeout(() => setIsEvolving(false), 2000)
      }
    }
  }, [totalSteps, previousSteps, currentStage.stage])

  const avatarGender = gender === 'prefer_not_to_say' ? 'male' : gender

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Evolution flash effect */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            className="absolute inset-0 bg-white rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Avatar */}
      <motion.div
        key={currentStage.stage}
        initial={isEvolving ? { scale: 0.5, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        {isEvolving && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, #FFD70080, transparent)' }}
            animate={{ scale: [1, 2, 1], opacity: [1, 0] }}
            transition={{ duration: 1 }}
          />
        )}
        {avatarGender === 'male' ? (
          <MaleAvatar stage={currentStage.stage} size={size} animated={!isEvolving} />
        ) : (
          <FemaleAvatar stage={currentStage.stage} size={size} animated={!isEvolving} />
        )}
      </motion.div>

      {showInfo && (
        <div className="text-center space-y-2 w-full max-w-xs">
          {/* Stage name */}
          <motion.div
            key={currentStage.stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-lg font-bold text-cobalt-500 dark:text-cobalt-300">
              {currentStage.emoji} {currentStage.name}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">
              "{currentStage.description}"
            </p>
          </motion.div>

          {/* Progress to next stage */}
          {nextStage && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress to {nextStage.name}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #0047AB, #3B82F6)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatSteps(nextStage.minSteps - totalSteps)} steps to go
              </p>
            </div>
          )}

          {currentStage.stage === 5 && (
            <motion.p
              className="text-sm font-bold text-yellow-500"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💥 MAX LEVEL ACHIEVED
            </motion.p>
          )}
        </div>
      )}
    </div>
  )
}
