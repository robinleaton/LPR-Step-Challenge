'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700/50 mt-auto py-4 px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {sponsor ? (
          // Sponsored footer
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Proudly Sponsored By</span>
              {sponsor.logo_url ? (
                <a href={sponsor.link || '#'} target="_blank" rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity">
                  <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 object-contain" />
                </a>
              ) : (
                <a href={sponsor.link || '#'} target="_blank" rel="noopener noreferrer"
                  className="font-bold text-cobalt-500 hover:text-cobalt-400 transition-colors">
                  {sponsor.name}
                </a>
              )}
            </div>
            {sponsor.tagline && (
              <p className="text-xs text-gray-400 italic hidden sm:block">{sponsor.tagline}</p>
            )}
          </>
        ) : (
          // Default LPR footer
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* LPR Logo placeholder */}
                <div className="w-8 h-8 rounded-full bg-cobalt-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">LPR</span>
                </div>
                <a href="https://leatonperformance.co.nz" target="_blank" rel="noopener noreferrer"
                  className="font-bold text-cobalt-500 hover:text-cobalt-400 transition-colors text-sm">
                  Leaton Performance
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-400 italic hidden sm:block">
              "You break it, we fix it." 💪
            </p>
            <a
              href="https://leatonperformance.co.nz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cobalt-500 hover:text-cobalt-400 transition-colors"
            >
              leatonperformance.co.nz →
            </a>
          </>
        )}
      </div>
    </footer>
  )
}
