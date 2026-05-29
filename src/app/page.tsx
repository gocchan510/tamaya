import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

import { SortToggle } from '@/components/festivals/SortToggle'
import { FilterToggle } from '@/components/festivals/FilterToggle'
import { MonthFilter } from '@/components/festivals/MonthFilter'
import { TierFilter } from '@/components/festivals/TierFilter'
import { FireworksFilter } from '@/components/festivals/FireworksFilter'
import { DateStatusFilter } from '@/components/festivals/DateStatusFilter'
import { SourceFilter } from '@/components/festivals/SourceFilter'
import { PrefectureFilter } from '@/components/festivals/PrefectureFilter'
import { TabSwitcher } from '@/components/festivals/TabSwitcher'
import { FilterDisclosure } from '@/components/festivals/FilterDisclosure'
import { QuickFilters } from '@/components/festivals/QuickFilters'
import { DebugToggle } from '@/components/festivals/DebugToggle'
import { ShareFavoritesButton, FavoritesImporter } from '@/components/festivals/ShareFavorites'
import { SearchBox } from '@/components/festivals/SearchBox'
import { FestivalList } from '@/components/festivals/FestivalList'
import { EventCalendar } from '@/components/festivals/EventCalendar'
import { Stars } from '@/components/ui/Stars'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

export default async function Home() {
  const supabase = await createClient()

  // PostgREST のサーバー max-rows が1000のため range で複数回取得
  async function fetchAllFestivals() {
    const all: FestivalWithYears[] = []
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('festivals')
        // カード/リスト/カレンダー/検索で実際に使う列だけに絞る（description等の重い未使用列を送らない）
        .select(`
          id, name, prefecture, city, official_url, tier, sources,
          festival_years(
            id, date, end_date, event_dates, start_time, end_time,
            max_shell_size, status, fireworks_count, expected_attendance,
            date_confirmed, paid_seats_status,
            lottery_periods(id, seat_name, lottery_start_at, lottery_end_at)
          )
        `)
        .order('ranking_score', { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) throw error
      const chunk = (data ?? []) as FestivalWithYears[]
      all.push(...chunk)
      if (chunk.length < pageSize) break
    }
    return all
  }
  const festivals = await fetchAllFestivals()

  const all = festivals

  // 都道府県の一覧（重複排除）
  const availablePrefectures = Array.from(new Set(all.map(f => f.prefecture))).sort()

  return (
    <div className="relative min-h-dvh">
      <Stars />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-16">
        {/* ヘッダー */}
        <header className="pt-14 pb-10 text-center">
          <p className="text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Japan Fireworks Guide</p>
          <h1 className="text-4xl font-bold tracking-tight glow-gold text-amber-300 mb-1">
            たまや
          </h1>
          <p className="text-sm text-white/30 tracking-widest">TAMAYA</p>
          <p className="text-white/40 text-sm mt-4">
            全国主要{all.length}大会の日程・抽選・天気を一覧
          </p>
        </header>

        {/* タブ + ソート + フィルタ */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Suspense>
            <FavoritesImporter />
          </Suspense>
          <Suspense>
            <ShareFavoritesButton />
          </Suspense>
          <Suspense>
            <DebugToggle />
          </Suspense>
          <Suspense>
            <TabSwitcher />
          </Suspense>
          <Suspense>
            <SearchBox candidates={all.map(f => ({ id: f.id, name: f.name, prefecture: f.prefecture, city: f.city, tier: f.tier }))} />
          </Suspense>
          <Suspense>
            <QuickFilters />
          </Suspense>
          <Suspense>
            <SortToggle />
          </Suspense>
          <Suspense>
            <EventCalendar festivals={all} />
          </Suspense>
          {/* 詳細フィルタは折りたたみに格納（デフォルト閉じ・アクティブ数バッジ付き） */}
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

        {/* 一覧 */}
        <Suspense>
          <FestivalList festivals={all} />
        </Suspense>

        {/* フッター */}
        <footer className="text-center mt-12 text-white/20 text-xs">
          © 2025 Tamaya
        </footer>
      </div>
    </div>
  )
}
