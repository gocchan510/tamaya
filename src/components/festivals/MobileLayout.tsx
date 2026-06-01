'use client'
import { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { EventCalendar } from './EventCalendar'
import { MapView } from './MapView'
import { MobileTabBar } from './MobileTabBar'
import { SearchBox } from './SearchBox'
import { SortToggle } from './SortToggle'
import { QuickFilters } from './QuickFilters'
import { HomeBaseSettings } from './HomeBaseSettings'
import { NearbyButton } from './NearbyButton'
import { FilterDisclosure } from './FilterDisclosure'
import { PrefectureFilter } from './PrefectureFilter'
import { TierFilter } from './TierFilter'
import { FireworksFilter } from './FireworksFilter'
import { DateStatusFilter } from './DateStatusFilter'
import { SourceFilter } from './SourceFilter'
import { MonthFilter } from './MonthFilter'
import { FilterToggle } from './FilterToggle'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

function Inner({
  festivals,
  candidates,
  availablePrefectures,
}: {
  festivals: FestivalWithYears[]
  candidates: { id: string; name: string; prefecture: string; city: string; tier: string | null }[]
  availablePrefectures: string[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const tab = searchParams.get('tab') ?? 'all'
  const activeTab = calendarOpen ? 'calendar'
    : mapOpen ? 'map'
    : tab === 'favorites' ? 'favorites'
    : 'list'

  useEffect(() => {
    if (calendarOpen || mapOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [calendarOpen, mapOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCalendarOpen(false); setMapOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const gotoFavTab = (fav: boolean) => {
    setCalendarOpen(false)
    setMapOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (fav) params.set('tab', 'favorites')
    else params.delete('tab')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const closeBtn = (onClose: () => void) => (
    <button
      onClick={onClose}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/80 border border-white/15 backdrop-blur-md"
    >
      ✕ 閉じる
    </button>
  )

  return (
    <>
      {/* モバイル上部コントロール */}
      <div className="lg:hidden flex flex-col gap-2 mb-4">
        <Suspense><NearbyButton /></Suspense>
        <Suspense><SearchBox candidates={candidates} /></Suspense>
        <Suspense><QuickFilters /></Suspense>
        <Suspense><SortToggle /></Suspense>
        <HomeBaseSettings />
        <Suspense>
          <FilterDisclosure>
            <PrefectureFilter available={availablePrefectures} />
            <TierFilter />
            <FireworksFilter />
            <DateStatusFilter />
            <SourceFilter />
            <MonthFilter />
            <FilterToggle />
          </FilterDisclosure>
        </Suspense>
      </div>

      {/* 底部タブバー */}
      <MobileTabBar
        activeTab={activeTab as 'list' | 'calendar' | 'favorites' | 'map'}
        onCalendar={() => { setCalendarOpen(o => !o); setMapOpen(false) }}
        onMap={() => { setMapOpen(o => !o); setCalendarOpen(false) }}
        onList={() => gotoFavTab(false)}
        onFavorites={() => gotoFavTab(true)}
      />

      {/* カレンダーモーダル */}
      {calendarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm">
          <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3">
            <span className="text-sm font-medium text-white/70">カレンダーで探す</span>
            {closeBtn(() => setCalendarOpen(false))}
          </div>
          <div className="pb-24">
            <EventCalendar festivals={festivals} />
          </div>
        </div>
      )}

      {/* マップモーダル */}
      {mapOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#0a0710]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.07] shrink-0">
            <span className="text-sm font-medium text-white/70">マップで探す</span>
            {closeBtn(() => setMapOpen(false))}
          </div>
          <MapView festivals={festivals} className="flex-1 min-h-0" />
        </div>
      )}
    </>
  )
}

export function MobileLayout(props: {
  festivals: FestivalWithYears[]
  candidates: { id: string; name: string; prefecture: string; city: string; tier: string | null }[]
  availablePrefectures: string[]
}) {
  return (
    <Suspense>
      <Inner {...props} />
    </Suspense>
  )
}
