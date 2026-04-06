'use client'
import { motion } from 'framer-motion'

interface MaleAvatarProps {
  stage: number
  animated?: boolean
  size?: number
}

// Dragon Ball Z inspired male avatar - SVG based, 5 evolution stages
export function MaleAvatar({ stage, animated = true, size = 200 }: MaleAvatarProps) {
  const s = size
  const scale = s / 200

  const stageConfig = {
    1: { // Couch Potato - chubby, baggy clothes
      bodyColor: '#FDBCB4',
      hairColor: '#2C1810',
      clothesColor: '#6B7280',
      clothesColor2: '#9CA3AF',
      eyeSize: 6,
      bodyWidth: 80,
      bodyHeight: 75,
      headSize: 55,
      muscleLines: false,
      spiky: false,
      shirtText: '😴',
    },
    2: { // The Mover - slightly less chubby, casual clothes
      bodyColor: '#F5A58A',
      hairColor: '#1C1410',
      clothesColor: '#3B82F6',
      clothesColor2: '#60A5FA',
      eyeSize: 5,
      bodyWidth: 70,
      bodyHeight: 70,
      headSize: 52,
      muscleLines: false,
      spiky: false,
      shirtText: '',
    },
    3: { // Weekend Warrior - athletic build, sporty
      bodyColor: '#E8926E',
      hairColor: '#1a1a1a',
      clothesColor: '#0047AB',
      clothesColor2: '#1d4ed8',
      eyeSize: 5,
      bodyWidth: 62,
      bodyHeight: 68,
      headSize: 50,
      muscleLines: true,
      spiky: true,
      shirtText: '',
    },
    4: { // Elite Athlete - muscular, performance wear
      bodyColor: '#D4784E',
      hairColor: '#000000',
      clothesColor: '#0047AB',
      clothesColor2: '#1E40AF',
      eyeSize: 5,
      bodyWidth: 58,
      bodyHeight: 70,
      headSize: 48,
      muscleLines: true,
      spiky: true,
      shirtText: '',
    },
    5: { // The Unstoppable - elite, glowing aura
      bodyColor: '#C4623A',
      hairColor: '#FFD700',
      clothesColor: '#0047AB',
      clothesColor2: '#1E3A8A',
      eyeSize: 6,
      bodyWidth: 56,
      bodyHeight: 72,
      headSize: 47,
      muscleLines: true,
      spiky: true,
      shirtText: '',
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
      <svg
        width={s}
        height={s}
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stage 5 aura glow */}
        {stage === 5 && (
          <>
            <motion.ellipse
              cx="100" cy="180" rx="55" ry="18"
              fill="#FFD700" fillOpacity="0.15"
              animate={{ rx: [55, 65, 55], fillOpacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.ellipse
              cx="100" cy="110" rx="70" ry="90"
              fill="#FFD700" fillOpacity="0.05"
              animate={{ fillOpacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}

        {/* Shadow */}
        <ellipse cx="100" cy="210" rx={cfg.bodyWidth * 0.7} ry="8" fill="#00000030" />

        {/* LEGS */}
        {stage <= 2 ? (
          // Chubby legs
          <>
            <rect x="68" y="165" width="26" height="38" rx="10" fill={cfg.clothesColor} />
            <rect x="106" y="165" width="26" height="38" rx="10" fill={cfg.clothesColor} />
            {/* Shoes */}
            <ellipse cx="81" cy="203" rx="16" ry="7" fill="#1a1a1a" />
            <ellipse cx="119" cy="203" rx="16" ry="7" fill="#1a1a1a" />
          </>
        ) : (
          // Athletic legs
          <>
            <rect x="70" y="162" width="22" height="42" rx="8" fill={cfg.clothesColor} />
            <rect x="108" y="162" width="22" height="42" rx="8" fill={cfg.clothesColor} />
            {/* Muscle definition */}
            <line x1="81" y1="170" x2="81" y2="198" stroke={cfg.clothesColor2} strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="119" y1="170" x2="119" y2="198" stroke={cfg.clothesColor2} strokeWidth="1.5" strokeOpacity="0.5" />
            {/* Athletic shoes */}
            <rect x="64" y="198" width="30" height="10" rx="5" fill="#111" />
            <rect x="106" y="198" width="30" height="10" rx="5" fill="#111" />
            <rect x="64" y="198" width="30" height="5" rx="3" fill="#333" />
            <rect x="106" y="198" width="30" height="5" rx="3" fill="#333" />
            {/* Shoe stripe */}
            <line x1="70" y1="201" x2="88" y2="201" stroke="white" strokeWidth="1.5" />
            <line x1="112" y1="201" x2="130" y2="201" stroke="white" strokeWidth="1.5" />
          </>
        )}

        {/* BODY / TORSO */}
        {stage <= 2 ? (
          // Baggy/chubby torso
          <rect
            x={100 - cfg.bodyWidth / 2} y="95"
            width={cfg.bodyWidth} height={cfg.bodyHeight}
            rx="20" fill={cfg.clothesColor}
          />
        ) : (
          // Athletic torso - V-shape
          <path
            d={`M ${100 - cfg.bodyWidth / 2} 170 
               L ${100 - cfg.bodyWidth / 2 - 5} 100 
               L ${100 + cfg.bodyWidth / 2 + 5} 100 
               L ${100 + cfg.bodyWidth / 2} 170 Z`}
            rx="8" fill={cfg.clothesColor}
          />
        )}

        {/* Shirt details */}
        {stage >= 3 && (
          <>
            {/* LPR stripe */}
            <rect x="88" y="100" width="24" height="4" rx="2" fill={cfg.clothesColor2} />
            {/* Muscle lines on shirt */}
            {cfg.muscleLines && (
              <>
                <line x1="100" y1="108" x2="100" y2="155" stroke={cfg.clothesColor2} strokeWidth="1" strokeOpacity="0.4" />
                <line x1="85" y1="115" x2="90" y2="145" stroke={cfg.clothesColor2} strokeWidth="1" strokeOpacity="0.3" />
                <line x1="115" y1="115" x2="110" y2="145" stroke={cfg.clothesColor2} strokeWidth="1" strokeOpacity="0.3" />
              </>
            )}
          </>
        )}

        {/* ARMS */}
        {stage <= 2 ? (
          // Chubby arms
          <>
            <rect x="28" y="98" width="26" height="55" rx="13" fill={cfg.bodyColor} />
            <rect x="146" y="98" width="26" height="55" rx="13" fill={cfg.bodyColor} />
            {/* Hands */}
            <circle cx="41" cy="157" r="11" fill={cfg.bodyColor} />
            <circle cx="159" cy="157" r="11" fill={cfg.bodyColor} />
          </>
        ) : (
          // Muscular arms
          <>
            <path d={`M${100 - cfg.bodyWidth / 2 - 4} 105 Q 22 115 28 155`} stroke={cfg.bodyColor} strokeWidth="22" strokeLinecap="round" fill="none" />
            <path d={`M${100 + cfg.bodyWidth / 2 + 4} 105 Q 178 115 172 155`} stroke={cfg.bodyColor} strokeWidth="22" strokeLinecap="round" fill="none" />
            {/* Bicep lines */}
            <path d={`M${100 - cfg.bodyWidth / 2 - 5} 120 Q 24 125 30 140`} stroke="#00000020" strokeWidth="3" fill="none" />
            <path d={`M${100 + cfg.bodyWidth / 2 + 5} 120 Q 176 125 170 140`} stroke="#00000020" strokeWidth="3" fill="none" />
            {/* Hands */}
            <circle cx="34" cy="158" r="12" fill={cfg.bodyColor} />
            <circle cx="166" cy="158" r="12" fill={cfg.bodyColor} />
          </>
        )}

        {/* NECK */}
        <rect x="88" y="82" width="24" height="18" rx="6" fill={cfg.bodyColor} />

        {/* HEAD */}
        <ellipse
          cx="100" cy={75 - (stage >= 3 ? 5 : 0)}
          rx={cfg.headSize / 2}
          ry={cfg.headSize / 2 + (stage <= 2 ? 4 : 0)}
          fill={cfg.bodyColor}
        />

        {/* HAIR - spiky DBZ style for higher stages */}
        {cfg.spiky ? (
          <g>
            {/* Spiky DBZ hair */}
            <path d="M73 60 L68 35 L80 55 L78 30 L88 52 L90 28 L96 50 L100 25 L104 50 L110 28 L112 52 L122 30 L120 55 L132 35 L127 60" fill={cfg.hairColor} />
            <path d="M73 65 Q75 55 80 60 Q85 52 90 58 Q95 50 100 56 Q105 50 110 58 Q115 52 120 60 Q125 55 127 65" fill={cfg.hairColor} />
            {/* Stage 5 golden hair */}
            {stage === 5 && (
              <>
                <motion.path
                  d="M73 60 L68 35 L80 55 L78 30 L88 52 L90 28 L96 50 L100 25 L104 50 L110 28 L112 52 L122 30 L120 55 L132 35 L127 60"
                  fill="#FFD700"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </>
            )}
          </g>
        ) : (
          // Regular hair for stage 1-2
          <ellipse cx="100" cy={65 - (cfg.headSize / 2) + 8} rx={cfg.headSize / 2 - 2} ry="14" fill={cfg.hairColor} />
        )}

        {/* FACE - Eyes */}
        <ellipse cx="90" cy="72" rx={cfg.eyeSize - 1} ry={cfg.eyeSize} fill="white" />
        <ellipse cx="110" cy="72" rx={cfg.eyeSize - 1} ry={cfg.eyeSize} fill="white" />
        <circle cx="91" cy="73" r={cfg.eyeSize - 3} fill="#1a1a1a" />
        <circle cx="111" cy="73" r={cfg.eyeSize - 3} fill="#1a1a1a" />
        {/* Eye shine */}
        <circle cx="93" cy="71" r="1.5" fill="white" />
        <circle cx="113" cy="71" r="1.5" fill="white" />

        {/* Eyebrows - more intense for higher stages */}
        <path d={stage >= 3 ? "M83 64 Q90 60 97 64" : "M84 65 Q90 63 96 65"} stroke={cfg.hairColor} strokeWidth={stage >= 3 ? "3" : "2"} strokeLinecap="round" fill="none" />
        <path d={stage >= 3 ? "M103 64 Q110 60 117 64" : "M104 65 Q110 63 116 65"} stroke={cfg.hairColor} strokeWidth={stage >= 3 ? "3" : "2"} strokeLinecap="round" fill="none" />

        {/* NOSE */}
        <path d="M100 76 Q97 80 99 82 Q100 83 101 82 Q103 80 100 76" fill="#C0806A" />

        {/* MOUTH */}
        {stage <= 1 ? (
          // Slightly frowning/neutral couch potato
          <path d="M92 87 Q100 84 108 87" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : stage === 5 ? (
          // Intense/determined smile
          <path d="M90 86 Q100 92 110 86" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          // Confident smile
          <path d="M91 86 Q100 91 109 86" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {/* Stage 5 - power lines / energy effect */}
        {stage === 5 && (
          <motion.g
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'mirror' }}
          >
            <line x1="30" y1="80" x2="55" y2="75" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="170" y1="80" x2="145" y2="75" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="50" y1="50" x2="70" y2="60" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="150" y1="50" x2="130" y2="60" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="0.5" />
          </motion.g>
        )}

        {/* Stage badge */}
        <circle cx="170" cy="30" r="16" fill={stage === 5 ? '#FFD700' : '#0047AB'} />
        <text x="170" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{stage}</text>
      </svg>
    </motion.div>
  )
}
