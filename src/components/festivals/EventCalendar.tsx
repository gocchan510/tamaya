'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { useFavorites } from '@/hooks/useFavorites'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

dayjs.locale('ja')

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

const WEEK = ['日', '月', '火', '水', '木', '金', '土']

function buildEventMap(festivals: FestivalWithYears[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const f of festivals) {
    const y = f.festival_years?.[0]
    if (!y) continue
    // event_dates 優先（複数回打ち上げ型）
    if (y.event_dates && y.event_dates.length > 0) {
      for (const d of y.event_dates) {
        ;(map[d] ??= []).push(f.id)
      }
      continue
    }
    if (!y.date) continue
    const start = new Date(y.date)
    const end = y.end_date ? new Date(y.end_date) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ymd = d.toISOString().slice(0, 10)
      ;(map[ymd] ??= []).push(f.id)
    }
  }
  return map
}

export function EventCalendar({ festivals }: { festivals: FestivalWithYears[] }) {
  const { ids: favIds, loaded } = useFavorites()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tab = searchParams.get('tab') ?? 'all'
  const tierRaw = searchParams.get('tier') ?? 'xl,l'
  const tierSet = useMemo(() => new Set(tierRaw.split(',').filter(Boolean)), [tierRaw])

  // フィルタ適用：tabがfavoritesならお気に入りのみ、そうでなければtierで絞り込み
  const filteredFestivals = useMemo(() => {
    if (tab === 'favorites') {
      if (!loaded) return []
      return festivals.filter(f => favIds.has(f.id))
    }
    return festivals.filter(f => tierSet.has(f.tier ?? 'unverified'))
  }, [festivals, tab, tierSet, favIds, loaded])

  const eventMap = useMemo(() => buildEventMap(filteredFestivals), [filteredFestivals])

  // 表示中の月: 最初の開催月を初期値、なければ今月
  const firstEventMonth = useMemo(() => {
    const keys = Object.keys(eventMap).sort()
    if (!keys.length) return dayjs()
    return dayjs(keys[0]).startOf('month')
  }, [eventMap])
  const [view, setView] = useState(firstEventMonth)

  // お気に入り開催日Set
  const favDateSet = useMemo(() => {
    const s = new Set<string>()
    for (const [date, fids] of Object.entries(eventMap)) {
      if (fids.some(id => favIds.has(id))) s.add(date)
    }
    return s
  }, [eventMap, favIds])

  // カレンダーグリッド (6週 x 7日)
  const startOfMonth = view.startOf('month')
  const gridStart = startOfMonth.startOf('week')
  const days: dayjs.Dayjs[] = []
  for (let i = 0; i < 42; i++) days.push(gridStart.add(i, 'day'))

  const setDateFilter = (dateStr: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (from === dateStr && to === dateStr) {
      params.delete('from')
      params.delete('to')
    } else {
      params.set('from', dateStr)
      params.set('to', dateStr)
      params.delete('month')
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const isSelected = (d: dayjs.Dayjs) => {
    const s = d.format('YYYY-MM-DD')
    return from === s && to === s
  }

  return (
    <div className="w-full max-w-xs glass rounded-2xl p-3 select-none">
      {/* 月ナビ */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setView(view.subtract(1, 'month'))}
          className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
          aria-label="前の月"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-white/80">
          {view.format('YYYY年M月')}
        </span>
        <button
          onClick={() => setView(view.add(1, 'month'))}
          className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      {/* 曜日ヘッダ */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK.map((w, i) => (
          <div
            key={w}
            className={`text-[10px] text-center py-0.5 ${
              i === 0 ? 'text-red-400/60' : i === 6 ? 'text-blue-400/60' : 'text-white/40'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const ymd = d.format('YYYY-MM-DD')
          const isCurMonth = d.month() === view.month()
          const hasEvent = !!eventMap[ymd]
          const isFav = favDateSet.has(ymd)
          const selected = isSelected(d)
          const isToday = d.isSame(dayjs(), 'day')
          return (
            <button
              key={i}
              onClick={() => hasEvent && setDateFilter(ymd)}
              disabled={!hasEvent || isPending}
              className={`aspect-square text-xs rounded-md transition-all ${
                !isCurMonth ? 'text-white/15' : ''
              } ${
                selected
                  ? 'bg-amber-400 text-night-950 font-bold ring-2 ring-amber-400/50'
                  : isFav
                    ? 'bg-red-500/35 text-red-100 border border-red-400/60 hover:bg-red-500/55 cursor-pointer font-bold'
                    : hasEvent
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40 hover:bg-sky-500/50 cursor-pointer font-medium'
                      : isCurMonth
                        ? 'text-white/40 cursor-default'
                        : 'cursor-default'
              } ${
                isToday && !selected ? 'ring-2 ring-emerald-400/80 ring-inset' : ''
              }`}
            >
              {d.date()}
            </button>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-2.5 mt-2 text-[10px] text-white/40 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-sky-500/40 border border-sky-400/50"></span>
          開催日
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500/50 border border-red-400/60"></span>
          ♥ お気に入り
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm ring-1 ring-emerald-400/80"></span>
          今日
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400"></span>
          選択中
        </span>
      </div>
    </div>
  )
}
