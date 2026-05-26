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

function buildEventMap(festivals: FestivalWithYears[], includeEnded: boolean): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  const todayStr = new Date().toISOString().slice(0, 10)
  const include = (ymd: string) => includeEnded || ymd >= todayStr
  for (const f of festivals) {
    const y = f.festival_years?.[0]
    if (!y) continue
    if (y.event_dates && y.event_dates.length > 0) {
      for (const d of y.event_dates) {
        if (include(d)) (map[d] ??= []).push(f.id)
      }
      continue
    }
    if (!y.date) continue
    const start = new Date(y.date)
    const end = y.end_date ? new Date(y.end_date) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ymd = d.toISOString().slice(0, 10)
      if (include(ymd)) (map[ymd] ??= []).push(f.id)
    }
  }
  return map
}

type SaleEntry = { festivalId: string; festivalName: string; seatName: string; endLabel: string; url: string | null; state: 'open' | 'upcoming' | 'ended' }

type MonthGridProps = {
  view: dayjs.Dayjs
  eventMap: Record<string, string[]>
  favDateSet: Set<string>
  favSaleSet: Set<string>
  /** 各お気に入り日付の大会リスト（ホバー表示用） */
  favFestivalsByDate: Map<string, Array<{ id: string; name: string }>>
  /** 各販売日の有料席リスト（ホバー表示用） */
  favSalesByDate: Map<string, SaleEntry[]>
  from: string | null
  to: string | null
  onPickDate: (ymd: string) => void
  isPending: boolean
  /** PC一覧モード用: 月見出しを内蔵し、グリッドをコンパクトに */
  compact?: boolean
}

function MonthGrid({ view, eventMap, favDateSet, favSaleSet, favFestivalsByDate, favSalesByDate, from, to, onPickDate, isPending, compact = false }: MonthGridProps) {
  const startOfMonth = view.startOf('month')
  const gridStart = startOfMonth.startOf('week')
  const days: dayjs.Dayjs[] = []
  for (let i = 0; i < 42; i++) days.push(gridStart.add(i, 'day'))

  const isSelected = (d: dayjs.Dayjs) => {
    const s = d.format('YYYY-MM-DD')
    return from === s && to === s
  }

  return (
    <div>
      {compact && (
        <div className="text-center text-xs font-medium text-white/70 mb-1.5">
          {view.format('M月')}
        </div>
      )}
      {/* 曜日ヘッダ */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {WEEK.map((w, i) => (
          <div
            key={w}
            className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-center py-0.5 ${
              i === 0 || i === 6 ? 'text-red-500' : 'text-white/40'
            }`}
          >
            {w}
          </div>
        ))}
      </div>
      {/* 日付グリッド */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {days.map((d, i) => {
          const ymd = d.format('YYYY-MM-DD')
          const isCurMonth = d.month() === view.month()
          const hasEvent = !!eventMap[ymd]
          const isFav = favDateSet.has(ymd)
          const hasSale = favSaleSet.has(ymd)
          const selected = isSelected(d)
          const isToday = d.isSame(dayjs(), 'day')
          const dow = d.day()
          const isWeekendOrHoliday = dow === 0 || dow === 6 || isHoliday(ymd)
          const defaultTextCls = !isCurMonth
            ? (isWeekendOrHoliday ? 'text-red-500/40' : 'text-white/15')
            : (isWeekendOrHoliday ? 'text-red-500 font-semibold' : 'text-white/40')
          const favList = isFav ? (favFestivalsByDate.get(ymd) ?? []) : []
          const saleList = hasSale ? (favSalesByDate.get(ymd) ?? []) : []
          const hasPopup = favList.length > 0 || saleList.length > 0
          return (
            <div key={i} className="relative group">
            <button
              onClick={() => hasEvent && onPickDate(ymd)}
              disabled={!hasEvent || isPending}
              className={`relative w-full aspect-square ${compact ? 'text-[10px]' : 'text-xs'} rounded-md transition-all ${
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
                <span className={`absolute ${compact ? 'bottom-0 left-1 right-1 h-[2px]' : 'bottom-0.5 left-1.5 right-1.5 h-[3px]'} bg-amber-400 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.7)]`} />
              )}
            </button>
            {/* ホバーポップアップ: 上にお気に入り大会 / 下に有料席販売 */}
            {hasPopup && (
              <div className={`hidden group-hover:flex flex-col absolute z-50 top-0 ${
                dow >= 4 ? 'right-full pr-1' : 'left-full pl-1'
              } min-w-[200px] max-w-[280px] gap-0.5`}>
                <div className={`bg-night-950 rounded-lg shadow-2xl border ${favList.length > 0 ? 'border-red-400/60' : 'border-amber-400/60'} p-1.5 flex flex-col gap-1`}>
                  <div className="text-[9px] text-white/50 px-1.5 pb-1 border-b border-white/10">
                    {dayjs(ymd).format('M月D日(dd)')}
                  </div>
                  {favList.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[9px] text-red-300/80 px-1.5">♥ お気に入り大会</div>
                      {favList.map(f => (
                        <Link
                          key={f.id}
                          href={`/festivals/${f.id}`}
                          className="block text-[11px] text-white/80 hover:text-amber-300 hover:bg-white/5 rounded px-1.5 py-1 truncate"
                        >
                          {f.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  {saleList.length > 0 && (
                    <div className={`flex flex-col gap-0.5 ${favList.length > 0 ? 'pt-1 mt-0.5 border-t border-white/10' : ''}`}>
                      <div className="text-[9px] text-amber-300/80 px-1.5">🎫 販売期間</div>
                      {saleList.map((s, i) => (
                        <Link
                          key={i}
                          href={`/festivals/${s.festivalId}`}
                          className="block text-[11px] text-white/80 hover:text-amber-300 hover:bg-white/5 rounded px-1.5 py-1"
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className={`text-[8px] font-bold shrink-0 ${
                              s.state === 'open' ? 'text-emerald-400'
                              : s.state === 'upcoming' ? 'text-amber-300'
                              : 'text-white/35'
                            }`}>
                              {s.state === 'open' ? '受付中' : s.state === 'upcoming' ? '予定' : '終了'}
                            </span>
                            <span className="truncate">{s.festivalName}</span>
                          </div>
                          <div className="text-[10px] text-white/50 truncate pl-7">
                            {s.seatName} {s.endLabel && <span className="text-amber-300/70">{s.endLabel}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EventCalendar({ festivals }: { festivals: FestivalWithYears[] }) {
  const { festivalIds: favIds, entries: favEntries, loaded } = useFavorites()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tab = searchParams.get('tab') ?? 'all'
  const tierRaw = searchParams.get('tier') ?? 'xl,l,m,s,unverified'
  const tierSet = useMemo(() => new Set(tierRaw.split(',').filter(Boolean)), [tierRaw])
  const dstatusRaw = searchParams.get('dstatus') ?? 'confirmed,estimated,undetermined'
  const dstatusSet = useMemo(() => new Set(dstatusRaw.split(',').filter(Boolean)), [dstatusRaw])
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const prefRaw = searchParams.get('pref') ?? ''
  const prefSet = useMemo(() => new Set(prefRaw.split(',').filter(Boolean)), [prefRaw])

  const filteredFestivals = useMemo(() => {
    let l = festivals
    const isFavTab = tab === 'favorites'
    if (isFavTab) {
      if (!loaded) return []
      l = l.filter(f => favIds.has(f.id))
    } else {
      l = l.filter(f => tierSet.has(f.tier ?? 'unverified'))
    }
    // お気に入りタブでは dstatus フィルタを無視（ユーザーが明示登録したものは常に表示）
    if (!isFavTab) {
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
    }
    if (q) {
      l = l.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.prefecture.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
      )
    }
    if (prefSet.size > 0) {
      l = l.filter(f => prefSet.has(f.prefecture))
    }
    return l
  }, [festivals, tab, tierSet, dstatusSet, q, prefSet, favIds, loaded])

  // 大会IDで引ける Map（古い fav エントリ判定にも使う）
  const festivalById = useMemo(() => new Map(festivals.map(f => [f.id, f])), [festivals])

  const eventMap = useMemo(() => {
    // お気に入りタブでは、お気に入りした日付のみをイベントとして表示
    // （多日開催大会の非お気に入り日が青く表示されるのを防ぐ）
    if (tab === 'favorites') {
      // お気に入りはユーザーが明示選択した日付なので、過去でも常に表示
      // yearHasDate フィルタは外す（DB変更で誤って弾かれるリスクあり）
      const map: Record<string, string[]> = {}
      const visibleIds = new Set(filteredFestivals.map(f => f.id))
      for (const e of favEntries) {
        const i = e.indexOf('|')
        if (i <= 0) continue
        const fid = e.slice(0, i)
        const date = e.slice(i + 1)
        if (!visibleIds.has(fid)) continue
        ;(map[date] ??= []).push(fid)
      }
      return map
    }
    return buildEventMap(filteredFestivals, dstatusSet.has('ended'))
  }, [filteredFestivals, dstatusSet, tab, favEntries, festivalById])

  const [view, setView] = useState(() => dayjs().startOf('month'))
  const [yearView, setYearView] = useState(() => dayjs().year())
  const [favListOpen, setFavListOpen] = useState(false)


  const favDateSet = useMemo(() => {
    const s = new Set<string>()
    const visibleIds = new Set(filteredFestivals.map(f => f.id))
    for (const e of favEntries) {
      const i = e.indexOf('|')
      if (i <= 0) continue
      const fid = e.slice(0, i)
      const date = e.slice(i + 1)
      if (visibleIds.has(fid)) s.add(date)
    }
    return s
  }, [favEntries, filteredFestivals])

  // ホバーポップアップ用: 日付 → 大会リスト
  const favFestivalsByDate = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>()
    for (const e of favEntries) {
      const i = e.indexOf('|')
      if (i <= 0) continue
      const fid = e.slice(0, i)
      const date = e.slice(i + 1)
      const f = festivalById.get(fid)
      if (!f) continue
      const arr = map.get(date) ?? []
      arr.push({ id: f.id, name: f.name })
      map.set(date, arr)
    }
    return map
  }, [favEntries, festivalById])

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

  // ホバーポップアップ用: 日付 → 有料席販売リスト（お気に入り大会のみ）
  const favSalesByDate = useMemo(() => {
    const map = new Map<string, SaleEntry[]>()
    if (!loaded) return map
    const now = dayjs()
    for (const f of festivals) {
      if (!favIds.has(f.id)) continue
      const lots = f.festival_years?.[0]?.lottery_periods ?? []
      for (const lp of lots) {
        if (!lp.lottery_start_at) continue
        const start = dayjs(lp.lottery_start_at)
        const end = lp.lottery_end_at ? dayjs(lp.lottery_end_at) : start
        const endLabel = lp.lottery_end_at ? `〜${dayjs(lp.lottery_end_at).format('M/D')}` : ''
        const state: 'open' | 'upcoming' | 'ended' = start.isAfter(now)
          ? 'upcoming'
          : (lp.lottery_end_at && dayjs(lp.lottery_end_at).isBefore(now) ? 'ended' : 'open')
        for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
          const ymd = d.format('YYYY-MM-DD')
          const arr = map.get(ymd) ?? []
          arr.push({
            festivalId: f.id,
            festivalName: f.name,
            seatName: lp.seat_name.replace(/（.*?）/g, '').replace('（確定）', '').trim(),
            endLabel,
            url: lp.lottery_url ?? null,
            state,
          })
          map.set(ymd, arr)
        }
      }
    }
    return map
  }, [festivals, favIds, loaded])

  const favLotteryRows = useMemo(() => {
    if (!loaded) return []
    const now = dayjs()
    type Row = { festivalId: string; festivalName: string; seatName: string; state: 'open' | 'upcoming' | 'ended'; sortKey: number; label: string }
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
        if (start.isAfter(now)) { state = 'upcoming'; label = `${start.format('M/D')}〜` }
        else if (end && end.isBefore(now)) { state = 'ended'; label = `${end.format('M/D')}終了` }
        else { state = 'open'; label = end ? `〜${end.format('M/D')}` : '受付中' }
        rows.push({
          festivalId: f.id, festivalName: f.name,
          seatName: lp.seat_name.replace(/（.*?）/g, '').replace('（確定）', '').trim(),
          state, sortKey: state === 'open' ? 0 : state === 'upcoming' ? 1 : 2, label,
        })
      }
    }
    return rows.sort((a, b) => a.sortKey - b.sortKey || a.festivalName.localeCompare(b.festivalName))
  }, [festivals, favIds, loaded])

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

  const Legend = (
    <div className="flex items-center justify-center gap-2.5 text-[10px] text-white/40 flex-wrap">
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
        🎫 販売期間
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
  )

  const FavLotteryList = favLotteryRows.length > 0 && (
    <div className="w-full max-w-md mx-auto glass rounded-2xl p-3 select-none">
      <button
        onClick={() => setFavListOpen(o => !o)}
        className="w-full flex items-center justify-between text-[10px] text-white/40 hover:text-white/70 transition-colors mb-1.5 py-0.5"
        aria-expanded={favListOpen}
      >
        <span>♥ お気に入り大会の有料席 ({favLotteryRows.length})</span>
        <span className="text-white/50">{favListOpen ? '▼' : '▶'}</span>
      </button>
      {favListOpen && (
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
      )}
    </div>
  )

  // 12ヶ月（PC用）: yearView の 1月〜12月
  const months = useMemo(() => {
    const arr: dayjs.Dayjs[] = []
    for (let m = 0; m < 12; m++) arr.push(dayjs(`${yearView}-01-01`).month(m))
    return arr
  }, [yearView])

  return (
    <>
      {/* ===== モバイル: 単月カレンダー + 有料席リスト（別カード） ===== */}
      <div className="lg:hidden w-full max-w-xs flex flex-col gap-3">
        <div className="glass rounded-2xl p-3 select-none">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setView(view.subtract(1, 'month'))}
            className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
            aria-label="前の月"
          >‹</button>
          <span className="text-sm font-medium text-white/80">{view.format('YYYY年M月')}</span>
          <button
            onClick={() => setView(view.add(1, 'month'))}
            className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
            aria-label="次の月"
          >›</button>
        </div>
        <MonthGrid
          view={view}
          eventMap={eventMap}
          favDateSet={favDateSet}
          favSaleSet={favSaleSet}
          favFestivalsByDate={favFestivalsByDate}
          favSalesByDate={favSalesByDate}
          from={from}
          to={to}
          onPickDate={setDateFilter}
          isPending={isPending}
        />
        <div className="mt-2">{Legend}</div>
        </div>
        {FavLotteryList}
      </div>

      {/* ===== PC: 12ヶ月一覧 + 有料席リスト（別カード） ===== */}
      {/* 親が flex items-center max-w-2xl なので、まず w-full で親幅を占有 */}
      <div className="hidden lg:block w-full">
        {/* w-screen + ml:calc(50%-50vw) でビューポート幅にブレイクアウト */}
        <div className="w-screen ml-[calc(50%-50vw)] px-6 flex flex-col items-center gap-3">
          <div className="w-full max-w-[1400px] glass rounded-2xl p-4 select-none">
          {/* 年ナビ */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setYearView(yearView - 1)}
              className="px-3 py-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors text-sm"
              aria-label="前の年"
            >‹ {yearView - 1}</button>
            <span className="text-base font-medium text-white/80">{yearView}年</span>
            <button
              onClick={() => setYearView(yearView + 1)}
              className="px-3 py-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors text-sm"
              aria-label="次の年"
            >{yearView + 1} ›</button>
          </div>
          {/* 12ヶ月グリッド: 4列x3行（xl: 6列x2行） */}
          <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
            {months.map((m) => (
              <div key={m.format('YYYY-MM')}>
                <MonthGrid
                  view={m}
                  eventMap={eventMap}
                  favDateSet={favDateSet}
                  favSaleSet={favSaleSet}
                  favFestivalsByDate={favFestivalsByDate}
          favSalesByDate={favSalesByDate}
                  from={from}
                  to={to}
                  onPickDate={setDateFilter}
                  isPending={isPending}
                  compact
                />
              </div>
            ))}
          </div>
          <div className="mt-3">{Legend}</div>
          </div>
          {FavLotteryList}
        </div>
      </div>
    </>
  )
}
