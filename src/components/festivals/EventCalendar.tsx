'use client'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { useFavorites } from '@/hooks/useFavorites'
import { isHoliday } from '@/lib/holidays'
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
  const dstatusRaw = searchParams.get('dstatus') ?? 'confirmed,estimated,undetermined'
  const dstatusSet = useMemo(() => new Set(dstatusRaw.split(',').filter(Boolean)), [dstatusRaw])
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const prefRaw = searchParams.get('pref') ?? ''
  const prefSet = useMemo(() => new Set(prefRaw.split(',').filter(Boolean)), [prefRaw])

  // フィルタ適用：tabがfavoritesならお気に入りのみ、そうでなければtierで絞り込み
  const filteredFestivals = useMemo(() => {
    let l = festivals
    if (tab === 'favorites') {
      if (!loaded) return []
      l = l.filter(f => favIds.has(f.id))
    } else {
      l = l.filter(f => tierSet.has(f.tier ?? 'unverified'))
    }
    // 日程ステータス（終了込み）
    const todayStr = new Date().toISOString().slice(0, 10)
    l = l.filter(f => {
      const y = f.festival_years?.[0]
      if (!y || !y.date) return dstatusSet.has('undetermined')
      const dates = (y.event_dates && y.event_dates.length > 0)
        ? y.event_dates
        : (y.end_date ? [y.date, y.end_date] : [y.date])
      const ended = dates[dates.length - 1] < todayStr
      if (ended) return dstatusSet.has('ended')
      return y.date_confirmed ? dstatusSet.has('confirmed') : dstatusSet.has('estimated')
    })
    // 検索
    if (q) {
      l = l.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.prefecture.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
      )
    }
    // 都道府県
    if (prefSet.size > 0) {
      l = l.filter(f => prefSet.has(f.prefecture))
    }
    return l
  }, [festivals, tab, tierSet, dstatusSet, q, prefSet, favIds, loaded])

  const eventMap = useMemo(() => buildEventMap(filteredFestivals), [filteredFestivals])

  // 表示中の月: 今月を初期値（ユーザーが手動で他の月に動かせる）
  const [view, setView] = useState(() => dayjs().startOf('month'))

  // お気に入り開催日Set
  const favDateSet = useMemo(() => {
    const s = new Set<string>()
    for (const [date, fids] of Object.entries(eventMap)) {
      if (fids.some(id => favIds.has(id))) s.add(date)
    }
    return s
  }, [eventMap, favIds])

  // お気に入り大会の有料席販売日Set（開始日〜終了日の範囲を埋める）
  const favSaleSet = useMemo(() => {
    const s = new Set<string>()
    if (!loaded) return s
    for (const f of festivals) {
      if (!favIds.has(f.id)) continue
      const lots = f.festival_years?.[0]?.lottery_periods ?? []
      for (const lp of lots) {
        if (!lp.lottery_start_at) continue
        const start = dayjs(lp.lottery_start_at)
        const end = lp.lottery_end_at ? dayjs(lp.lottery_end_at) : start
        for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
          s.add(d.format('YYYY-MM-DD'))
        }
      }
    }
    return s
  }, [festivals, favIds, loaded])

  // お気に入り大会の販売スケジュール集計（リスト用）
  const favLotteryRows = useMemo(() => {
    if (!loaded) return []
    const now = dayjs()
    type Row = {
      festivalId: string
      festivalName: string
      seatName: string
      state: 'open' | 'upcoming' | 'ended'
      sortKey: number
      label: string
    }
    const rows: Row[] = []
    for (const f of festivals) {
      if (!favIds.has(f.id)) continue
      const lots = f.festival_years?.[0]?.lottery_periods ?? []
      for (const lp of lots) {
        if (!lp.lottery_start_at) continue
        const start = dayjs(lp.lottery_start_at)
        const end = lp.lottery_end_at ? dayjs(lp.lottery_end_at) : null
        let state: 'open' | 'upcoming' | 'ended'
        let label = ''
        if (start.isAfter(now)) {
          state = 'upcoming'
          label = `${start.format('M/D')}〜`
        } else if (end && end.isBefore(now)) {
          state = 'ended'
          label = `${end.format('M/D')}終了`
        } else {
          state = 'open'
          label = end ? `〜${end.format('M/D')}` : '受付中'
        }
        rows.push({
          festivalId: f.id,
          festivalName: f.name,
          seatName: lp.seat_name.replace(/（.*?）/g, '').replace('（確定）', '').trim(),
          state,
          sortKey: state === 'open' ? 0 : state === 'upcoming' ? 1 : 2,
          label,
        })
      }
    }
    return rows.sort((a, b) => a.sortKey - b.sortKey || a.festivalName.localeCompare(b.festivalName))
  }, [festivals, favIds, loaded])

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
              i === 0 || i === 6 ? 'text-red-500' : 'text-white/40'
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
          const hasSale = favSaleSet.has(ymd)
          const selected = isSelected(d)
          const isToday = d.isSame(dayjs(), 'day')
          const dow = d.day() // 0:日 6:土
          const isWeekendOrHoliday = dow === 0 || dow === 6 || isHoliday(ymd)
          // ベース文字色（イベント/お気に入り/選択中で上書きされない場合のフォールバック）
          const defaultTextCls = !isCurMonth
            ? (isWeekendOrHoliday ? 'text-red-500/40' : 'text-white/15')
            : (isWeekendOrHoliday ? 'text-red-500 font-semibold' : 'text-white/40')
          return (
            <button
              key={i}
              onClick={() => hasEvent && setDateFilter(ymd)}
              disabled={!hasEvent || isPending}
              className={`relative aspect-square text-xs rounded-md transition-all ${
                selected
                  ? 'bg-amber-400 text-night-950 font-bold ring-2 ring-amber-400/50'
                  : isFav
                    ? 'bg-red-500/35 text-red-100 border border-red-400/60 hover:bg-red-500/55 cursor-pointer font-bold'
                    : hasEvent
                      ? `bg-sky-500/30 ${isWeekendOrHoliday ? 'text-red-400 font-bold' : 'text-sky-200'} border border-sky-400/40 hover:bg-sky-500/50 cursor-pointer font-medium`
                      : `${defaultTextCls} cursor-default`
              } ${
                isToday && !selected ? 'ring-2 ring-emerald-400/80 ring-inset' : ''
              }`}
            >
              {d.date()}
              {hasSale && (
                <span className="absolute bottom-0.5 left-1.5 right-1.5 h-[3px] bg-amber-400 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.7)]" />
              )}
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
          ♥
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-[3px] rounded-full bg-amber-400"></span>
          🎫 販売中
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

      {/* お気に入り大会の販売スケジュール */}
      {favLotteryRows.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="text-[10px] text-white/40 mb-1.5">♥ お気に入り大会の有料席</p>
          <div className="flex flex-col gap-1">
            {favLotteryRows.map((r, i) => (
              <Link
                key={i}
                href={`/festivals/${r.festivalId}`}
                className="flex items-center justify-between gap-2 text-[11px] hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[9px] font-bold shrink-0 ${
                    r.state === 'open' ? 'text-emerald-400'
                    : r.state === 'upcoming' ? 'text-amber-300'
                    : 'text-white/35'
                  }`}>
                    {r.state === 'open' ? '受付中' : r.state === 'upcoming' ? '予定' : '終了'}
                  </span>
                  <span className={`truncate ${r.state === 'ended' ? 'text-white/30' : 'text-white/70'}`}>
                    {r.festivalName}
                  </span>
                </div>
                <span className={`shrink-0 text-[10px] ${r.state === 'ended' ? 'text-white/25' : 'text-white/40'}`}>{r.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
