'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useFilteredFestivals } from '@/hooks/useFilteredFestivals'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

// Leaflet は SSR 非対応のため動的インポート
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => (
  <div className="flex-1 flex items-center justify-center text-white/30 text-sm">地図を読み込み中…</div>
)})

export function MapView({ festivals, className }: { festivals: FestivalWithYears[]; className?: string }) {
  const { list } = useFilteredFestivals(festivals)
  // 位置情報のある大会のみ表示
  const mapped = list.filter(f => f.lat && f.lng)

  return (
    <div className={className}>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/30 text-sm">地図を読み込み中…</div>}>
        <LeafletMap festivals={mapped} />
      </Suspense>
    </div>
  )
}
