'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SponsorFooter() {
  const [sponsor, setSponsor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        setSponsor(data)
        setLoading(false)
      })
  }, [])

  if (loading) return null

  const name = sponsor?.name ?? 'Leaton Performance & Rehab'
  const link = sponsor?.link ?? 'https://leatonperformance.co.nz'
  const tagline = sponsor?.tagline ?? 'leatonperformance.co.nz'
  const logo = sponsor?.logo_url ?? null

  return (
    <div
      className="relative w-full mt-auto overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #0a0a0a 0%, #1a0f00 50%, #0a0a0a 100%)' }}
    >
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #f59e0b80, transparent)' }} />
      <footer className="relative px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full gap-4 group">
            <div className="flex items-center gap-3">
              {!logo && (
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(245,158,11,0.5)' }}>
                  <span style={{ color: '#000', fontSize: 11, fontWeight: 900, letterSpacing: '-0.5px' }}>LPR</span>
                </div>
              )}
              {logo && <img src={logo} alt={name} style={{ height: 32, objectFit: 'contain' }} />}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(245,158,11,0.65)', textTransform: 'uppercase', marginBottom: 2 }}>
                  ✦ Proudly Sponsored By ✦
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }} className="group-hover:text-amber-300 transition-colors">
                  {name}
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fcd34d' }} className="group-hover:text-yellow-200 transition-colors">
                {tagline}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                Tap to learn more →
              </div>
            </div>
          </a>
        </div>
      </footer>
    </div>
  )
}
