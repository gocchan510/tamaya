'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { FestivalCard } from './FestivalCard'
import { ActiveFilters } from './ActiveFilters'
import { ClearFiltersButton } from './ClearFiltersButton'
import { useFavorites } from '@/hooks/useFavorites'
import { useHomeBase } from '@/hooks/useHomeBase'
import { useFilteredFestivals } from '@/hooks/useFilteredFestivals'
import { haversineKm } from '@/lib/distance'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

export function FestivalList({ festivals }: { festivals: FestivalWithYears[] }) {
  const searchParams = useSearchParams()
  const { datesOf, loaded } = useFavorites()
  const { homeBase } = useHomeBase()
  const debug = searchParams.get('debug') === '1'
  const contextDate = (() => {
    const from = searchParams.get('from'), to = searchParams.get('to')
    return from && to && from === to ? from : null
  })()

  const { list, tab, sort } = useFilteredFestivals(festivals)

  // 段階表示
  const PAGE = 40
  const [visible, setVisible] = useState(PAGE)
  useEffect(() => { setVisible(PAGE) }, [list])
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisible(v => Math.min(v + PAGE, list.length)) },
      { rootMargin: '600px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [list.length])
  const shown = list.slice(0, visible)

  if (tab === 'favorites' && loaded && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        まだお気に入り登録された大会はありません<br/>
        <span className="text-white/30 text-xs mt-2 inline-block">カレンダーで日付をタップ、または詳細ページの♡で追加</span>
      </p>
    )
  }
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-4xl opacity-40">🎇</p>
        <p className="text-white/50 text-sm">条件に合う大会が見つかりませんでした</p>
        <div className="flex flex-wrap justify-center max-w-md">
          <ActiveFilters />
        </div>
        <p className="text-white/30 text-xs">チップの ✕ で個別に外すか、まとめて解除できます</p>
        <ClearFiltersButton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ActiveFilters />
      <p className="text-xs text-white/40 -mt-1 mb-1">
        該当 <span className="text-white/70 font-semibold">{list.length}</span> 件
      </p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        {shown.map((festival, i) => {
          const year = festival.festival_years?.[0] ?? null
          const lotteries = year?.lottery_periods ?? []
          let rankLabel: string | undefined
          let referenceDate: string | undefined
          let favDatesProp: string[] | undefined
          if (tab === 'favorites') {
            const ds = datesOf(festival.id)
            if (ds.length > 0) {
              const today = new Date().toISOString().slice(0, 10)
              const upcoming = ds.find(d => d >= today) ?? ds[0]
              referenceDate = upcoming
              const d = new Date(upcoming)
              rankLabel = `${d.getMonth() + 1}/${d.getDate()}`
              favDatesProp = ds
            }
          }
          const distKm = (sort === 'distance' && homeBase && festival.lat && festival.lng)
            ? haversineKm(homeBase.lat, homeBase.lng, festival.lat, festival.lng)
            : undefined
          return (
            <FestivalCard
              key={festival.id}
              festival={festival}
              year={year}
              rank={i + 1}
              rankLabel={rankLabel}
              referenceDate={referenceDate}
              favDates={favDatesProp}
              lotteries={lotteries}
              contextDate={contextDate}
              debug={debug}
              distKm={distKm}
            />
          )
        })}
      </div>
      {visible < list.length && (
        <div ref={sentinelRef} className="py-6 text-center text-white/30 text-xs">
          読み込み中… <span className="text-white/20">({visible} / {list.length})</span>
        </div>
      )}
    </div>
  )
}
