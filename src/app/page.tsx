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
import { CalendarDisclosure } from '@/components/festivals/CalendarDisclosure'
import { QuickFilters } from '@/components/festivals/QuickFilters'
import { DebugToggle } from '@/components/festivals/DebugToggle'
import { ShareFavoritesButton, FavoritesImporter } from '@/components/festivals/ShareFavorites'
import { SearchBox } from '@/components/festivals/SearchBox'
import { FestivalList } from '@/components/festivals/FestivalList'
import { EventCalendar } from '@/components/festivals/EventCalendar'
import { HomeBaseSettings } from '@/components/festivals/HomeBaseSettings'
import { UpdateBanner } from '@/components/festivals/UpdateBanner'
import { LATEST } from '@/lib/changelog'
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
          id, name, prefecture, city, lat, lng, official_url, tier, sources,
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

      <div className="relative z-10 max-w-2xl lg:max-w-7xl mx-auto px-4 pb-16">
        {/* ヘッダー */}
        <header className="pt-14 pb-10 text-center">
          <p className="text-xs tracking-[0.3em] text-amber-400/60 uppercase mb-3">Japan Fireworks Guide</p>
          <h1 className="text-5xl font-extrabold tracking-tight text-aurora mb-1 pb-1">
            たまや
          </h1>
          <p className="text-sm text-white/30 tracking-widest">TAMAYA</p>
          <p className="text-white/40 text-sm mt-4">
            全国主要{all.length}大会の日程・抽選・天気を一覧
          </p>
          <Suspense>
            <UpdateBanner
              date={LATEST.date}
              text={LATEST.text}
              sha={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)}
            />
          </Suspense>
        </header>

        {/* PC: 左サイドバー(操作系) + 右メイン(一覧) の2ペイン / モバイル: 縦積み */}
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
          {/* 左: 操作系（PCでは sticky で追従） */}
          <aside className="flex flex-col items-center gap-3 mb-8 lg:mb-0 lg:sticky lg:top-4 lg:self-start">
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
            <HomeBaseSettings />
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
          </aside>

          {/* 右: 一覧 */}
          <main className="min-w-0">
            <Suspense>
              <FestivalList festivals={all} />
            </Suspense>
          </main>
        </div>

        {/* カレンダーは右下フローティングボタンで常時アクセス可（押すとモーダル全幅） */}
        <Suspense>
          <CalendarDisclosure>
            <EventCalendar festivals={all} />
          </CalendarDisclosure>
        </Suspense>

        {/* フッター */}
        <footer className="text-center mt-12 text-white/20 text-xs">
          © 2025 Tamaya
        </footer>
      </div>
    </div>
  )
}
