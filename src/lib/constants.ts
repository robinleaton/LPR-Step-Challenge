// ============================================
// AVATAR STAGES
// ============================================
export const AVATAR_STAGES = [
  {
    stage: 1,
    name: 'The Couch Potato',
    emoji: '🛋️',
    minSteps: 0,
    maxSteps: 49999,
    description: 'Every legend starts somewhere... usually on the couch.',
    bodyType: 'chubby',
    clothing: 'baggy',
  },
  {
    stage: 2,
    name: 'The Mover',
    emoji: '🚶',
    minSteps: 50000,
    maxSteps: 349999,
    description: 'You\'re off the couch. The world better watch out.',
    bodyType: 'slightly-built',
    clothing: 'casual',
  },
  {
    stage: 3,
    name: 'The Weekend Warrior',
    emoji: '⚔️',
    minSteps: 350000,
    maxSteps: 749999,
    description: 'You live for the challenge. Weekends are your battlefield.',
    bodyType: 'athletic',
    clothing: 'sporty',
  },
  {
    stage: 4,
    name: 'The Elite Athlete',
    emoji: '🏆',
    minSteps: 750000,
    maxSteps: 1199999,
    description: 'You\'ve separated yourself from the pack. Pure dedication.',
    bodyType: 'muscular',
    clothing: 'performance',
  },
  {
    stage: 5,
    name: 'The Unstoppable',
    emoji: '💥',
    minSteps: 1200000,
    maxSteps: Infinity,
    description: 'You are a force of nature. Nothing can stop you now.',
    bodyType: 'elite',
    clothing: 'elite-athletic',
  },
]

export function getAvatarStage(totalSteps: number) {
  for (let i = AVATAR_STAGES.length - 1; i >= 0; i--) {
    if (totalSteps >= AVATAR_STAGES[i].minSteps) {
      return AVATAR_STAGES[i]
    }
  }
  return AVATAR_STAGES[0]
}

export function getNextStage(totalSteps: number) {
  const current = getAvatarStage(totalSteps)
  return AVATAR_STAGES.find(s => s.stage === current.stage + 1) || null
}

export function getProgressToNextStage(totalSteps: number) {
  const current = getAvatarStage(totalSteps)
  const next = getNextStage(totalSteps)
  if (!next) return 100
  const range = next.minSteps - current.minSteps
  const progress = totalSteps - current.minSteps
  return Math.min(100, Math.round((progress / range) * 100))
}

// ============================================
// NZ DISTANCE COMPARISONS
// ============================================
// Average step = ~0.762 metres = 0.000762 km
const STEP_TO_KM = 0.000762

export const NZ_DISTANCES = [
  {
    km: 1.5,
    label: 'Sky Tower height',
    description: '🗼 You\'ve climbed the Sky Tower!',
    steps: Math.round(1.5 / STEP_TO_KM),
    emoji: '🗼',
  },
  {
    km: 90,
    label: '90 Mile Beach',
    description: '🏖️ You\'ve walked the legendary 90 Mile Beach!',
    steps: Math.round(90 / STEP_TO_KM),
    emoji: '🏖️',
  },
  {
    km: 118,
    label: 'Auckland to Hamilton',
    description: '🚗 You\'ve walked from Auckland to Hamilton!',
    steps: Math.round(118 / STEP_TO_KM),
    emoji: '🚗',
  },
  {
    km: 200,
    label: 'Auckland to Rotorua',
    description: '🌋 You\'ve walked from Auckland to Rotorua!',
    steps: Math.round(200 / STEP_TO_KM),
    emoji: '🌋',
  },
  {
    km: 3085,
    label: 'Te Araroa Trail',
    description: '🥾 You\'ve virtually completed the entire Te Araroa Trail!',
    steps: Math.round(3085 / STEP_TO_KM),
    emoji: '🥾',
  },
  {
    km: 490,
    label: 'Auckland to Wellington',
    description: '🇳🇿 You\'ve walked from Auckland to Wellington!',
    steps: Math.round(490 / STEP_TO_KM),
    emoji: '🇳🇿',
  },
  {
    km: 750,
    label: 'Auckland to Christchurch',
    description: '✈️ You\'ve walked from Auckland to Christchurch!',
    steps: Math.round(750 / STEP_TO_KM),
    emoji: '✈️',
  },
  {
    km: 2500,
    label: 'Cape Reinga to Bluff',
    description: '🏁 You\'ve walked the entire length of New Zealand! Cape Reinga to Bluff!',
    steps: Math.round(2500 / STEP_TO_KM),
    emoji: '🏁',
  },
]

export function getNZMilestone(totalSteps: number) {
  // Return the most recent milestone achieved
  const achieved = NZ_DISTANCES.filter(d => totalSteps >= d.steps)
  return achieved[achieved.length - 1] || null
}

export function getNextNZMilestone(totalSteps: number) {
  return NZ_DISTANCES.find(d => totalSteps < d.steps) || null
}

export function formatSteps(steps: number): string {
  if (steps >= 1000000) return `${(steps / 1000000).toFixed(1)}M`
  if (steps >= 1000) return `${(steps / 1000).toFixed(1)}K`
  return steps.toLocaleString()
}

export function stepsToKm(steps: number): string {
  return (steps * STEP_TO_KM).toFixed(1)
}

// ============================================
// AGE BRACKET HELPERS
// ============================================
export function getAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const AGE_BRACKETS = [
  { label: 'Under 18', min: 0, max: 17 },
  { label: '18–24', min: 18, max: 24 },
  { label: '25–34', min: 25, max: 34 },
  { label: '35–44', min: 35, max: 44 },
  { label: '45–54', min: 45, max: 54 },
  { label: '55–64', min: 55, max: 64 },
  { label: '65+', min: 65, max: 999 },
]
