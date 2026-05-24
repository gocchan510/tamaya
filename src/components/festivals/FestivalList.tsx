'use client'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { FestivalCard } from './FestivalCard'
import { useFavorites } from '@/hooks/useFavorites'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

// festival_year から該当する全日付を返す（event_dates 優先、なければ date..end_date）
function collectDates(y: FestivalYear): string[] {
  if (y.event_dates && y.event_dates.length > 0) return y.event_dates
  if (!y.date) return []
  if (!y.end_date) return [y.date]
  const dates: string[] = []
  for (let d = new Date(y.date); d <= new Date(y.end_date); d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

// 大会が「終了済み」か判定（全日程が過去）
function isEnded(y: FestivalYear, todayStr: string): boolean {
  const dates = collectDates(y)
  if (dates.length === 0) return false
  return dates[dates.length - 1] < todayStr
}

export function FestivalList({ festivals }: { festivals: FestivalWithYears[] }) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'all'
  const sort = searchParams.get('sort') ?? 'ranking'
  const filter = searchParams.get('filter')
  const month = searchParams.get('month')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tierRaw = searchParams.get('tier') ?? 'xl,l'
  const tierSet = useMemo(() => new Set(tierRaw.split(',').filter(Boolean)), [tierRaw])
  const dstatusRaw = searchParams.get('dstatus') ?? 'confirmed,estimated,undetermined'
  const dstatusSet = useMemo(() => new Set(dstatusRaw.split(',').filter(Boolean)), [dstatusRaw])
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const sourceRaw = searchParams.get('source') ?? ''
  const sourceSet = useMemo(() => new Set(sourceRaw.split(',').filter(Boolean)), [sourceRaw])
  const prefRaw = searchParams.get('pref') ?? ''
  const prefSet = useMemo(() => new Set(prefRaw.split(',').filter(Boolean)), [prefRaw])
  const { ids, loaded } = useFavorites()

  const list = useMemo(() => {
    let l = festivals
    if (tab === 'favorites') {
      if (!loaded) return [] // 初期描画でホタンチラ防止
      l = l.filter(f => ids.has(f.id))
    } else {
      l = l.filter(f => tierSet.has(f.tier ?? 'unverified') || (!f.tier && tierSet.has('s')))
    }
    // 日程ステータスフィルタ（終了込み）
    const todayStr = new Date().toISOString().slice(0, 10)
    l = l.filter(f => {
      const y = f.festival_years?.[0]
      if (!y || !y.date) return dstatusSet.has('undetermined')
      if (isEnded(y, todayStr)) return dstatusSet.has('ended')
      return y.date_confirmed ? dstatusSet.has('confirmed') : dstatusSet.has('estimated')
    })
    // 検索フィルタ（名前・県・市の部分一致）
    if (q) {
      l = l.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.prefecture.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
      )
    }
    // ソースフィルタ（OR: いずれかに含まれれば表示）
    if (sourceSet.size > 0) {
      l = l.filter(f => (f.sources ?? []).some(s => sourceSet.has(s)))
    }
    // 都道府県フィルタ
    if (prefSet.size > 0) {
      l = l.filter(f => prefSet.has(f.prefecture))
    }
    if (month) {
      const m = parseInt(month, 10)
      l = l.filter(f => {
        const y = f.festival_years?.[0]
        if (!y) return false
        const dates = collectDates(y)
        return dates.some(d => new Date(d).getMonth() + 1 === m)
      })
    }
    if (from || to) {
      l = l.filter(f => {
        const y = f.festival_years?.[0]
        if (!y) return false
        const dates = collectDates(y)
        return dates.some(d => {
          if (from && d < from) return false
          if (to && d > to) return false
          return true
        })
      })
    }
    if (filter === 'open') {
      const now = new Date()
      l = l.filter(f => {
        const lots = f.festival_years?.[0]?.lottery_periods ?? []
        return lots.some(p => {
          if (!p.lottery_start_at) return false
          const started = new Date(p.lottery_start_at) <= now
          const notEnded = !p.lottery_end_at || new Date(p.lottery_end_at) > now
          return started && notEnded
        })
      })
    }
    if (sort === 'date') {
      l = [...l].sort((a, b) => {
        const ya = a.festival_years?.[0]?.date ?? '9999'
        const yb = b.festival_years?.[0]?.date ?? '9999'
        return ya.localeCompare(yb)
      })
    }
    return l
  }, [festivals, tab, sort, filter, month, from, to, tierSet, dstatusSet, q, sourceSet, prefSet, ids, loaded])

  if (tab === 'favorites' && loaded && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        まだお気に入り登録された大会はありません<br/>
        <span className="text-white/30 text-xs mt-2 inline-block">カード右上の♡をタップで追加</span>
      </p>
    )
  }
  if (filter === 'open' && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        現在受付中の有料席はありません
      </p>
    )
  }
  if (month && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        {month}月開催の大会はありません
      </p>
    )
  }
  if ((from || to) && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        指定期間に開催の大会はありません
      </p>
    )
  }
  if (q && list.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">
        「{q}」に一致する大会はありません
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((festival, i) => {
        const year = festival.festival_years?.[0] ?? null
        const lotteries = year?.lottery_periods ?? []
        return (
          <FestivalCard
            key={festival.id}
            festival={festival}
            year={year}
            rank={i + 1}
            lotteries={lotteries}
          />
        )
      })}
    </div>
  )
}
