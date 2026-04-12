'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  const sponsorName = sponsor?.name ?? 'Leaton Performance & Rehab'
  const sponsorLink = sponsor?.link ?? 'https://leatonperformance.co.nz'
  const sponsorTagline = sponsor?.tagline ?? 'leatonperformance.co.nz'

  return (
    <div className="relative w-full mt-auto overflow-hidden" style={{ background: 'linear-gradient(90deg, #111 0%, #2a1a00 50%, #111 100%)' }}>
      {/* Gold shimmer top border */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />

      {/* Shimmer overlay */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sponsor-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent);
          animation: shimmer 4s infinite;
        }
      `}</style>

      <footer className="sponsor-shimmer relative px-6 py-4">
        <div className="max-w-4xl mx-auto">
          
            href={sponsorLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full gap-4 group"
          >
            <div className="flex items-center gap-3">
              {!sponsor?.logo_url && (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}>
                  <span style={{ color: '#000', fontSize: 11, fontWeight: 900 }}>LPR</span>
                </div>
              )}
              {sponsor?.logo_url && (
                <img src={sponsor.logo_url} alt={sponsorName} style={{ height: 32, objectFit: 'contain' }} />
              )}
              <div className="flex flex-col">
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(245,158,11,0.7)', textTransform: 'uppercase' }}>
                  ✦ Proudly Sponsored By ✦
                </span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }} className="group-hover:text-amber-300 transition-colors">
                  {sponsorName}
                </span>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fcd34d' }} className="group-hover:text-amber-200 transition-colors">
                {sponsorTagline}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Tap to learn more →</p>
            </div>
          </a>
        </div>
      </footer>
    </div>
  )
}
