'use client'
import { useState, Suspense } from 'react'
import { MapView } from './MapView'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

export function DesktopMapToggle({ festivals, children }: {
  festivals: FestivalWithYears[]
  children: React.ReactNode  // FestivalList
}) {
  const [showMap, setShowMap] = useState(false)

  return (
    <>
      {/* トグルボタン */}
      <div className="hidden lg:flex justify-end mb-3">
        <button
          onClick={() => setShowMap(v => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
            showMap
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
              : 'bg-white/[0.04] text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
          }`}
        >
          <span>🗺️</span>
          {showMap ? '一覧に戻る' : 'マップで見る'}
        </button>
      </div>

      {showMap ? (
        <MapView festivals={festivals} className="h-[70vh] rounded-2xl overflow-hidden" />
      ) : (
        children
      )}
    </>
  )
}
