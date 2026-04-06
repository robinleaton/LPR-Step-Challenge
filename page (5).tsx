'use client'
import { motion } from 'framer-motion'

interface FemaleAvatarProps {
  stage: number
  animated?: boolean
  size?: number
}

export function FemaleAvatar({ stage, animated = true, size = 200 }: FemaleAvatarProps) {
  const s = size

  const stageConfig = {
    1: {
      bodyColor: '#FDBCB4',
      hairColor: '#8B4513',
      clothesColor: '#9CA3AF',
      clothesColor2: '#D1D5DB',
      bodyWidth: 76,
      headSize: 54,
    },
    2: {
      bodyColor: '#F5A58A',
      hairColor: '#6B3A2A',
      clothesColor: '#EC4899',
      clothesColor2: '#F9A8D4',
      bodyWidth: 68,
      headSize: 51,
    },
    3: {
      bodyColor: '#E8926E',
      hairColor: '#2C1810',
      clothesColor: '#0047AB',
      clothesColor2: '#3B82F6',
      bodyWidth: 60,
      headSize: 49,
    },
    4: {
      bodyColor: '#D4784E',
      hairColor: '#1a1a1a',
      clothesColor: '#0047AB',
      clothesColor2: '#1E40AF',
      bodyWidth: 56,
      headSize: 47,
    },
    5: {
      bodyColor: '#C4623A',
      hairColor: '#FFD700',
      clothesColor: '#0047AB',
      clothesColor2: '#1E3A8A',
      bodyWidth: 54,
      headSize: 46,
    },
  }

  const cfg = stageConfig[stage as keyof typeof stageConfig] || stageConfig[1]

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={animated ? { y: [0, -6, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: s, height: s }}
    >
      <svg width={s} height={s} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Stage 5 aura */}
        {stage === 5 && (
          <motion.ellipse cx="100" cy="110" rx="75" ry="95"
            fill="#FFD700" fillOpacity="0.06"
            animate={{ fillOpacity: [0.06, 0.18, 0.06] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Shadow */}
        <ellipse cx="100" cy="210" rx={cfg.bodyWidth * 0.65} ry="8" fill="#00000030" />

        {/* LEGS */}
        {stage <= 2 ? (
          <>
            <rect x="70" y="165" width="24" height="36" rx="10" fill={cfg.clothesColor} />
            <rect x="106" y="165" width="24" height="36" rx="10" fill={cfg.clothesColor} />
            <ellipse cx="82" cy="202" rx="15" ry="7" fill="#1a1a1a" />
            <ellipse cx="118" cy="202" rx="15" ry="7" fill="#1a1a1a" />
          </>
        ) : (
          <>
            <rect x="72" y="163" width="20" height="40" rx="8" fill={cfg.clothesColor} />
            <rect x="108" y="163" width="20" height="40" rx="8" fill={cfg.clothesColor} />
            {/* Athletic shoes */}
            <rect x="66" y="198" width="28" height="10" rx="5" fill="#111" />
            <rect x="106" y="198" width="28" height="10" rx="5" fill="#111" />
            <line x1="72" y1="201" x2="88" y2="201" stroke="#FF69B4" strokeWidth="1.5" />
            <line x1="112" y1="201" x2="128" y2="201" stroke="#FF69B4" strokeWidth="1.5" />
          </>
        )}

        {/* BODY / TORSO */}
        {stage <= 2 ? (
          // Baggy/fuller torso
          <path d={`M ${100 - cfg.bodyWidth / 2} 170 Q ${100 - cfg.bodyWidth / 2 - 10} 140 ${100 - cfg.bodyWidth / 2 - 2} 100 L ${100 + cfg.bodyWidth / 2 + 2} 100 Q ${100 + cfg.bodyWidth / 2 + 10} 140 ${100 + cfg.bodyWidth / 2} 170 Z`}
            fill={cfg.clothesColor} />
        ) : (
          // Athletic hourglass torso
          <path d={`M ${100 - cfg.bodyWidth / 2} 170 Q ${100 - cfg.bodyWidth / 2 + 4} 145 ${100 - cfg.bodyWidth / 2 - 3} 115 L ${100 - cfg.bodyWidth / 2 - 2} 100 L ${100 + cfg.bodyWidth / 2 + 2} 100 L ${100 + cfg.bodyWidth / 2 + 3} 115 Q ${100 + cfg.bodyWidth / 2 - 4} 145 ${100 + cfg.bodyWidth / 2} 170 Z`}
            fill={cfg.clothesColor} />
        )}

        {/* Shirt/top details */}
        {stage >= 3 && (
          <rect x="88" y="100" width="24" height="4" rx="2" fill={cfg.clothesColor2} />
        )}

        {/* ARMS */}
        {stage <= 2 ? (
          <>
            <rect x="30" y="100" width="22" height="50" rx="11" fill={cfg.bodyColor} />
            <rect x="148" y="100" width="22" height="50" rx="11" fill={cfg.bodyColor} />
            <circle cx="41" cy="154" r="10" fill={cfg.bodyColor} />
            <circle cx="159" cy="154" r="10" fill={cfg.bodyColor} />
          </>
        ) : (
          <>
            <path d={`M${100 - cfg.bodyWidth / 2 - 2} 107 Q 26 118 32 153`} stroke={cfg.bodyColor} strokeWidth="20" strokeLinecap="round" fill="none" />
            <path d={`M${100 + cfg.bodyWidth / 2 + 2} 107 Q 174 118 168 153`} stroke={cfg.bodyColor} strokeWidth="20" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="156" r="11" fill={cfg.bodyColor} />
            <circle cx="164" cy="156" r="11" fill={cfg.bodyColor} />
          </>
        )}

        {/* NECK */}
        <rect x="90" y="82" width="20" height="18" rx="6" fill={cfg.bodyColor} />

        {/* HEAD */}
        <ellipse cx="100" cy={73 - (stage >= 3 ? 4 : 0)} rx={cfg.headSize / 2} ry={cfg.headSize / 2 + (stage <= 2 ? 3 : 0)} fill={cfg.bodyColor} />

        {/* HAIR */}
        {stage <= 2 ? (
          // Long flowing hair (stages 1-2)
          <>
            <ellipse cx="100" cy={63 - cfg.headSize / 2 + 8} rx={cfg.headSize / 2 + 2} ry="14" fill={cfg.hairColor} />
            <rect x={100 - cfg.headSize / 2 - 4} y={65 - cfg.headSize / 2 + 10} width="12" height="35" rx="6" fill={cfg.hairColor} />
            <rect x={100 + cfg.headSize / 2 - 8} y={65 - cfg.headSize / 2 + 10} width="12" height="35" rx="6" fill={cfg.hairColor} />
          </>
        ) : stage <= 4 ? (
          // Ponytail / sporty hair
          <>
            <ellipse cx="100" cy="58" rx={cfg.headSize / 2} ry="14" fill={cfg.hairColor} />
            <rect x={100 + cfg.headSize / 2 - 8} y="52" width="10" height="25" rx="5" fill={cfg.hairColor} />
            <ellipse cx={100 + cfg.headSize / 2 + 2} y="80" rx="6" ry="4" fill={cfg.hairColor} />
          </>
        ) : (
          // Stage 5 - wild spiked golden hair
          <>
            <path d="M75 63 L70 35 L82 57 L80 32 L90 54 L92 28 L98 50 L102 26 L106 50 L108 28 L115 55 L120 32 L125 63" fill={cfg.hairColor} />
            <ellipse cx="100" cy="60" rx={cfg.headSize / 2} ry="12" fill={cfg.hairColor} />
            {stage === 5 && (
              <motion.path
                d="M75 63 L70 35 L82 57 L80 32 L90 54 L92 28 L98 50 L102 26 L106 50 L108 28 L115 55 L120 32 L125 63"
                fill="#FFD700"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </>
        )}

        {/* EYES */}
        <ellipse cx="90" cy="71" rx="5" ry="5.5" fill="white" />
        <ellipse cx="110" cy="71" rx="5" ry="5.5" fill="white" />
        <circle cx="91" cy="72" r="3.5" fill="#4B2C20" />
        <circle cx="111" cy="72" r="3.5" fill="#4B2C20" />
        <circle cx="92" cy="70.5" r="1.5" fill="white" />
        <circle cx="112" cy="70.5" r="1.5" fill="white" />

        {/* Eyelashes */}
        <path d="M84 67 Q90 63 96 67" stroke={cfg.hairColor} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M104 67 Q110 63 116 67" stroke={cfg.hairColor} strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* NOSE */}
        <circle cx="100" cy="78" r="1.5" fill="#C0806A" fillOpacity="0.6" />

        {/* MOUTH */}
        {stage === 5 ? (
          <path d="M90 85 Q100 91 110 85" stroke="#C87941" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : stage >= 3 ? (
          <path d="M91 85 Q100 90 109 85" stroke="#C87941" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M93 85 Q100 88 107 85" stroke="#C87941" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {/* Stage 5 energy lines */}
        {stage === 5 && (
          <motion.g animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <line x1="28" y1="78" x2="55" y2="73" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="172" y1="78" x2="145" y2="73" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
          </motion.g>
        )}

        {/* Stage badge */}
        <circle cx="170" cy="30" r="16" fill={stage === 5 ? '#FFD700' : '#0047AB'} />
        <text x="170" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{stage}</text>
      </svg>
    </motion.div>
  )
}
