import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

import { SortToggle } from '@/components/festivals/SortToggle'
import { FilterToggle } from '@/components/festivals/FilterToggle'
import { MonthFilter } from '@/components/festivals/MonthFilter'
import { TierFilter } from '@/components/festivals/TierFilter'
import { TabSwitcher } from '@/components/festivals/TabSwitcher'
import { FestivalList } from '@/components/festivals/FestivalList'
import { EventCalendar } from '@/components/festivals/EventCalendar'
import { Stars } from '@/components/ui/Stars'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

export default async function Home() {
  const supabase = await createClient()

  const { data: festivals } = await supabase
    .from('festivals')
    .select('*, festival_years(*, lottery_periods(*))')
    .order('ranking_score', { ascending: false })

  const all = (festivals ?? []) as FestivalWithYears[]

  // カレンダー用：開催日 → festival_id[] のマップ（複数日対応）
  const eventMap: Record<string, string[]> = {}
  for (const f of all) {
    const y = f.festival_years?.[0]
    if (!y?.date) continue
    const start = new Date(y.date)
    const end = y.end_date ? new Date(y.end_date) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ymd = d.toISOString().slice(0, 10)
      ;(eventMap[ymd] ??= []).push(f.id)
    }
  }

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
            <TabSwitcher />
          </Suspense>
          <Suspense>
            <SortToggle />
          </Suspense>
          <Suspense>
            <TierFilter />
          </Suspense>
          <Suspense>
            <MonthFilter />
          </Suspense>
          <Suspense>
            <EventCalendar eventMap={eventMap} />
          </Suspense>
          <Suspense>
            <FilterToggle />
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
