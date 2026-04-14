'use client'
import { motion } from 'framer-motion'

interface MaleAvatarProps {
  stage: number
  animated?: boolean
  size?: number
}

export function MaleAvatar({ stage, animated = true, size = 200 }: MaleAvatarProps) {
  const s = size

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
          <>
            <motion.ellipse cx="100" cy="185" rx="80" ry="20" fill="#FFD700" fillOpacity="0.18"
              animate={{ rx: [80, 90, 80], fillOpacity: [0.18, 0.32, 0.18] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.ellipse cx="100" cy="110" rx="95" ry="100" fill="#FFD700" fillOpacity="0.07"
              animate={{ fillOpacity: [0.07, 0.16, 0.07] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
          </>
        )}

        {/* Shadow */}
        <ellipse cx="100" cy="212" rx="45" ry="7" fill="#00000025" />

        {/* ── LEGS ── */}
        {stage <= 2 ? (
          <>
            <rect x="66" y="168" width="28" height="40" rx="12" fill={stage === 1 ? '#6B7280' : '#3B82F6'} />
            <rect x="106" y="168" width="28" height="40" rx="12" fill={stage === 1 ? '#6B7280' : '#3B82F6'} />
            <ellipse cx="80" cy="208" rx="17" ry="7" fill="#1a1a1a" />
            <ellipse cx="120" cy="208" rx="17" ry="7" fill="#1a1a1a" />
          </>
        ) : (
          <>
            <rect x="70" y="162" width="22" height="44" rx="8" fill="#0047AB" />
            <rect x="108" y="162" width="22" height="44" rx="8" fill="#0047AB" />
            <rect x="62" y="200" width="32" height="10" rx="5" fill="#111" />
            <rect x="104" y="200" width="32" height="10" rx="5" fill="#111" />
            <line x1="68" y1="203" x2="88" y2="203" stroke="white" strokeWidth="1.5" />
            <line x1="110" y1="203" x2="130" y2="203" stroke="white" strokeWidth="1.5" />
          </>
        )}

        {/* ── BODY / TORSO — V-taper increases each stage ── */}
        {stage === 1 && (
          // Stage 1: Boxy reverse taper — wider at bottom
          <>
            <path d="M55 168 L60 100 L140 100 L145 168 Z" fill="#6B7280" />
            <ellipse cx="100" cy="148" rx="46" ry="22" fill="#9CA3AF" opacity="0.4" />
            <text x="100" y="140" textAnchor="middle" fontSize="20">😴</text>
          </>
        )}
        {stage === 2 && (
          // Stage 2: Slight taper beginning
          <path d="M58 168 L55 100 L145 100 L142 168 Z" fill="#3B82F6" />
        )}
        {stage === 3 && (
          // Stage 3: Clear V-taper
          <>
            <path d="M72 165 L52 98 L148 98 L128 165 Z" fill="#0047AB" />
            <rect x="88" y="98" width="24" height="4" rx="2" fill="#1d4ed8" />
            <line x1="100" y1="106" x2="100" y2="155" stroke="#1d4ed8" strokeWidth="1" strokeOpacity="0.4" />
          </>
        )}
        {stage === 4 && (
          // Stage 4: Dramatic V — trap bumps at shoulders
          <>
            <path d="M76 165 L44 96 L156 96 L124 165 Z" fill="#0047AB" />
            <ellipse cx="50" cy="100" rx="14" ry="10" fill="#0047AB" />
            <ellipse cx="150" cy="100" rx="14" ry="10" fill="#0047AB" />
            <rect x="88" y="96" width="24" height="4" rx="2" fill="#1E40AF" />
            <path d="M78 110 Q100 120 122 110" stroke="#1E3A8A" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M84 125 Q100 130 116 125" stroke="#1E3A8A" strokeWidth="1.5" fill="none" opacity="0.4" />
          </>
        )}
        {stage === 5 && (
          // Stage 5: Extreme comic-book V — massive shoulders, wasp waist
          <>
            <path d="M78 165 L28 94 L172 94 L122 165 Z" fill="#0047AB" />
            <ellipse cx="36" cy="97" rx="20" ry="14" fill="#0047AB" />
            <ellipse cx="164" cy="97" rx="20" ry="14" fill="#0047AB" />
            <rect x="88" y="94" width="24" height="4" rx="2" fill="#1E3A8A" />
            <path d="M76 108 Q100 120 124 108" stroke="#1E3A8A" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M84 124 Q100 130 116 124" stroke="#1E3A8A" strokeWidth="1.5" fill="none" opacity="0.4" />
          </>
        )}

        {/* ── ARMS — width and position scale with V-taper ── */}
        {stage === 1 && (
          <>
            <path d="M60 108 Q30 130 35 168" stroke="#FDBCB4" strokeWidth="26" strokeLinecap="round" fill="none" />
            <path d="M140 108 Q170 130 165 168" stroke="#FDBCB4" strokeWidth="26" strokeLinecap="round" fill="none" />
            <circle cx="37" cy="168" r="13" fill="#FDBCB4" />
            <circle cx="163" cy="168" r="13" fill="#FDBCB4" />
          </>
        )}
        {stage === 2 && (
          <>
            <path d="M55 108 Q26 128 30 162" stroke="#F5A58A" strokeWidth="24" strokeLinecap="round" fill="none" />
            <path d="M145 108 Q174 128 170 162" stroke="#F5A58A" strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="32" cy="163" r="12" fill="#F5A58A" />
            <circle cx="168" cy="163" r="12" fill="#F5A58A" />
          </>
        )}
        {stage === 3 && (
          <>
            <path d="M52 104 Q18 118 24 156" stroke="#E8926E" strokeWidth="24" strokeLinecap="round" fill="none" />
            <path d="M148 104 Q182 118 176 156" stroke="#E8926E" strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="26" cy="157" r="13" fill="#E8926E" />
            <circle cx="174" cy="157" r="13" fill="#E8926E" />
          </>
        )}
        {stage === 4 && (
          <>
            <path d="M46 100 Q10 114 16 152" stroke="#D4784E" strokeWidth="26" strokeLinecap="round" fill="none" />
            <path d="M154 100 Q190 114 184 152" stroke="#D4784E" strokeWidth="26" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="154" r="14" fill="#D4784E" />
            <circle cx="182" cy="154" r="14" fill="#D4784E" />
          </>
        )}
        {stage === 5 && (
          <>
            <path d="M32 96 Q-6 110 0 148" stroke="#C4623A" strokeWidth="28" strokeLinecap="round" fill="none" />
            <path d="M168 96 Q206 110 200 148" stroke="#C4623A" strokeWidth="28" strokeLinecap="round" fill="none" />
            <circle cx="2" cy="150" r="15" fill="#C4623A" />
            <circle cx="198" cy="150" r="15" fill="#C4623A" />
          </>
        )}

        {/* ── NECK ── */}
        <rect x="88" y="82" width="24" height="18" rx="6"
          fill={stage === 1 ? '#FDBCB4' : stage === 2 ? '#F5A58A' : stage === 3 ? '#E8926E' : stage === 4 ? '#D4784E' : '#C4623A'} />

        {/* ── HEAD ── */}
        <ellipse cx="100" cy={stage <= 2 ? 72 : 68} rx={stage <= 2 ? 28 : 24} ry={stage <= 2 ? 30 : 26}
          fill={stage === 1 ? '#FDBCB4' : stage === 2 ? '#F5A58A' : stage === 3 ? '#E8926E' : stage === 4 ? '#D4784E' : '#C4623A'} />

        {/* ── HAIR ── */}
        {stage <= 2 ? (
          <ellipse cx="100" cy={stage === 1 ? 46 : 48} rx={stage === 1 ? 26 : 24} ry="13"
            fill={stage === 1 ? '#2C1810' : '#1C1410'} />
        ) : (
          <g>
            <path d="M75 60 L70 35 L82 55 L80 30 L90 52 L92 28 L98 50 L102 26 L106 50 L110 28 L112 52 L120 30 L118 55 L130 35 L125 60"
              fill={stage === 5 ? '#FFD700' : '#1a1a1a'} />
            <path d="M75 64 Q84 54 94 59 Q104 51 114 59 Q122 54 125 64"
              fill={stage === 5 ? '#FFD700' : '#1a1a1a'} />
            {stage === 5 && (
              <motion.path
                d="M75 60 L70 35 L82 55 L80 30 L90 52 L92 28 L98 50 L102 26 L106 50 L110 28 L112 52 L120 30 L118 55 L130 35 L125 60"
                fill="#FFD700"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
          </g>
        )}

        {/* ── EYES ── */}
        {stage === 1 ? (
          // Sleepy half-closed
          <>
            <ellipse cx="90" cy="72" rx="6" ry="6" fill="white" />
            <ellipse cx="110" cy="72" rx="6" ry="6" fill="white" />
            <circle cx="91" cy="73" r="3.5" fill="#1a1a1a" />
            <circle cx="111" cy="73" r="3.5" fill="#1a1a1a" />
            <line x1="84" y1="69" x2="96" y2="69" stroke="#FDBCB4" strokeWidth="4" />
            <line x1="104" y1="69" x2="116" y2="69" stroke="#FDBCB4" strokeWidth="4" />
          </>
        ) : (
          <>
            <ellipse cx="90" cy={stage <= 2 ? 71 : 67} rx="5" ry="5" fill="white" />
            <ellipse cx="110" cy={stage <= 2 ? 71 : 67} rx="5" ry="5" fill="white" />
            <circle cx="91" cy={stage <= 2 ? 72 : 68} r="3" fill="#1a1a1a" />
            <circle cx="111" cy={stage <= 2 ? 72 : 68} r="3" fill="#1a1a1a" />
            <circle cx="93" cy={stage <= 2 ? 70 : 66} r="1.5" fill="white" />
            <circle cx="113" cy={stage <= 2 ? 70 : 66} r="1.5" fill="white" />
          </>
        )}

        {/* ── EYEBROWS ── */}
        {stage >= 3 && (
          <>
            <path d={`M83 ${stage >= 4 ? 58 : 61} Q90 ${stage >= 4 ? 54 : 57} 97 ${stage >= 4 ? 58 : 61}`}
              stroke={stage === 5 ? '#AA8800' : '#1a1a1a'} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d={`M103 ${stage >= 4 ? 58 : 61} Q110 ${stage >= 4 ? 54 : 57} 117 ${stage >= 4 ? 58 : 61}`}
              stroke={stage === 5 ? '#AA8800' : '#1a1a1a'} strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
        {stage <= 2 && (
          <>
            <path d={`M84 ${stage === 1 ? 65 : 64} Q90 ${stage === 1 ? 63 : 62} 96 ${stage === 1 ? 65 : 64}`}
              stroke={stage === 1 ? '#2C1810' : '#1C1410'} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d={`M104 ${stage === 1 ? 65 : 64} Q110 ${stage === 1 ? 63 : 62} 116 ${stage === 1 ? 65 : 64}`}
              stroke={stage === 1 ? '#2C1810' : '#1C1410'} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* ── NOSE ── */}
        <path d="M100 76 Q97 80 99 82 Q100 83 101 82 Q103 80 100 76" fill="#C0806A" />

        {/* ── MOUTH ── */}
        {stage === 1 ? (
          <path d="M92 87 Q100 84 108 87" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : stage === 5 ? (
          <path d="M90 82 Q100 88 110 82" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M91 83 Q100 88 109 83" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {/* ── STAGE 5 ENERGY LINES ── */}
        {stage === 5 && (
          <motion.g
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'mirror' }}
          >
            <line x1="15" y1="80" x2="45" y2="75" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="185" y1="80" x2="155" y2="75" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="30" y1="50" x2="55" y2="62" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="170" y1="50" x2="145" y2="62" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="0.5" />
          </motion.g>
        )}
