'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  link: string | null
  tagline: string | null
}

export function SponsorFooter() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSponsor = async () => {
      const { data } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single()
      setSponsor(data)
      setLoading(false)
    }
    fetchSponsor()
  }, [])

  if (loading) return null

  const content = sponsor ? (
    
      href={sponsor.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between w-full gap-4 group"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-400/70">
            ✦ Proudly Sponsored By ✦
          </span>
          {sponsor.logo_url ? (
            <img src={sponsor.logo_url} alt={sponsor.name} className="h-7 object-contain mt-1" />
          ) : (
            <span className="text-lg font-black text-white group-hover:text-amber-300 transition-colors tracking-tight">
              {sponsor.name}
            </span>
          )}
        </div>
      </div>
      {sponsor.tagline && (
        <div className="text-right">
          <p className="text-sm font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
            {sponsor.tagline}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Tap to learn more →</p>
        </div>
      )}
    </a>
  ) : (
    
      href="https://leatonperformance.co.nz"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between w-full gap-4 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span className="text-black text-xs font-black">LPR</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-400/70">
            ✦ Proudly Sponsored By ✦
          </span>
          <span className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
            Leaton Performance & Rehab
          </span>
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
          leatonperformance.co.nz
        </p>
        <p className="text-[10px] text-white/40 mt-0.5">Tap to learn more →</p>
      </div>
    </a>
  )

  return (
    <div className="relative w-full mt-auto overflow-hidden">
      {/* Shimmer animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-amber-950/40 to-gray-900" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
      {/* Gold top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      <footer className="relative px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {content}
        </div>
      </footer>
    </div>
  )
}
