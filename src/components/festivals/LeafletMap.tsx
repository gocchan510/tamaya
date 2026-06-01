'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import Link from 'next/link'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

const TIER_COLOR: Record<string, string> = {
  xl: '#fbbf24',   // gold
  l:  '#f97316',   // orange
  m:  '#60a5fa',   // blue
  s:  '#9ca3af',   // gray
  unverified: '#6b7280',
}

function firstDate(f: FestivalWithYears): string {
  const y = f.festival_years?.[0]
  if (!y) return ''
  if (y.event_dates?.length) return y.event_dates[0]
  return y.date ?? ''
}

export default function LeafletMap({ festivals }: { festivals: FestivalWithYears[] }) {
  // Leaflet のデフォルトアイコンパス修正（Next.js対策）
  useEffect(() => {
    // CircleMarker を使うので特にアイコン修正は不要
  }, [])

  return (
    <MapContainer
      center={[36.5, 137.5]}
      zoom={6}
      className="w-full h-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {festivals.map(f => {
        const color = TIER_COLOR[f.tier ?? 'unverified'] ?? '#6b7280'
        const date = firstDate(f)
        const y = f.festival_years?.[0]
        return (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={f.tier === 'xl' ? 10 : f.tier === 'l' ? 8 : 6}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-bold text-gray-800 leading-snug">{f.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.prefecture} {f.city}</p>
                {date && <p className="text-gray-600 text-xs mt-1">📅 {date.replace(/-/g, '/')}</p>}
                {y?.fireworks_count && <p className="text-gray-600 text-xs">🎆 {y.fireworks_count.toLocaleString()}発</p>}
                <Link
                  href={`/festivals/${f.id}`}
                  className="mt-2 inline-block text-xs text-amber-600 font-medium hover:underline"
                >
                  詳細を見る →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
