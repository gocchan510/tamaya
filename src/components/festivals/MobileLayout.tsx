'use client'
import { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { EventCalendar } from './EventCalendar'
import { MobileTabBar } from './MobileTabBar'
import { SearchBox } from './SearchBox'
import { SortToggle } from './SortToggle'
import { QuickFilters } from './QuickFilters'
import { HomeBaseSettings } from './HomeBaseSettings'
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
  const [searchOpen, setSearchOpen] = useState(false)

  const tab = searchParams.get('tab') ?? 'all'
  const activeTab = calendarOpen ? 'calendar'
    : searchOpen ? 'search'
    : tab === 'favorites' ? 'favorites'
    : 'list'

  // カレンダー・検索を閉じたら overflow を戻す
  useEffect(() => {
    if (calendarOpen || searchOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [calendarOpen, searchOpen])

  // Escape で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCalendarOpen(false); setSearchOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const gotoFavTab = (fav: boolean) => {
    setCalendarOpen(false)
    setSearchOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (fav) params.set('tab', 'favorites')
    else params.delete('tab')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <>
      {/* モバイル上部コントロール（検索・クイックフィルタ・ソート・拠点・フィルタ） */}
      <div className="lg:hidden flex flex-col gap-2 mb-4">
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

      {/* モバイル底部タブバー */}
      <MobileTabBar
        activeTab={activeTab as 'list' | 'calendar' | 'favorites' | 'search'}
        onCalendar={() => { setCalendarOpen(o => !o); setSearchOpen(false) }}
        onSearch={() => { setSearchOpen(o => !o); setCalendarOpen(false) }}
        onList={() => gotoFavTab(false)}
        onFavorites={() => gotoFavTab(true)}
      />

      {/* モバイル: カレンダーモーダル */}
      {calendarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm">
          <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3">
            <span className="text-sm font-medium text-white/70">カレンダーで探す</span>
            <button
              onClick={() => setCalendarOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/80 border border-white/15 backdrop-blur-md"
            >
              ✕ 閉じる
            </button>
          </div>
          <div className="pb-24">
            <EventCalendar festivals={festivals} />
          </div>
        </div>
      )}

      {/* モバイル: 検索モーダル */}
      {searchOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
            <div className="flex-1">
              <Suspense><SearchBox candidates={candidates} autoFocus /></Suspense>
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-white/50 hover:text-white/90 px-2 py-1 text-sm"
            >
              キャンセル
            </button>
          </div>
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
