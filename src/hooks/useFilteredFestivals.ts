'use client'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useFavorites } from './useFavorites'
import { useHomeBase } from './useHomeBase'
import { haversineKm } from '@/lib/distance'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'

type FestivalWithYears = Festival & { festival_years: (FestivalYear & { lottery_periods: LotteryPeriod[] })[] }

function collectDates(y: FestivalYear): string[] {
  if (y.event_dates && y.event_dates.length > 0) return y.event_dates
  if (!y.date) return []
  if (!y.end_date) return [y.date]
  const dates: string[] = []
  for (let d = new Date(y.date); d <= new Date(y.end_date); d.setDate(d.getDate() + 1))
    dates.push(d.toISOString().slice(0, 10))
  return dates
}

function isEnded(y: FestivalYear, todayStr: string): boolean {
  const dates = collectDates(y)
  if (dates.length === 0) return false
  return dates[dates.length - 1] < todayStr
}

function shellSizeNumeric(s: string | null | undefined): number {
  if (!s) return 0
  const m1 = s.match(/(\d+(?:\.\d+)?)\s*号/)
  if (m1) return parseFloat(m1[1])
  const sakuMap: Record<string, number> = {
    '一': 10, '二': 20, '三': 30, '四': 40, '五': 50,
    '六': 60, '七': 70, '八': 80, '九': 90, '十': 100,
  }
  for (const [kanji, val] of Object.entries(sakuMap))
    if (s.includes(kanji + '尺')) return val
  if (s.includes('尺玉') || s.includes('尺')) return 10
  return 0
}

export function useFilteredFestivals(festivals: FestivalWithYears[]) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'all'
  const sort = searchParams.get('sort') ?? (tab === 'favorites' ? 'date' : 'ranking')
  const filter = searchParams.get('filter')
  const month = searchParams.get('month')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tierRaw = searchParams.get('tier') ?? 'xl,l,m,s,unverified'
  const tierSet = useMemo(() => new Set(tierRaw.split(',').filter(Boolean)), [tierRaw])
  const dstatusRaw = searchParams.get('dstatus') ?? 'confirmed,estimated,undetermined'
  const dstatusSet = useMemo(() => new Set(dstatusRaw.split(',').filter(Boolean)), [dstatusRaw])
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const sourceRaw = searchParams.get('source') ?? ''
  const sourceSet = useMemo(() => new Set(sourceRaw.split(',').filter(Boolean)), [sourceRaw])
  const prefRaw = searchParams.get('pref') ?? ''
  const prefSet = useMemo(() => new Set(prefRaw.split(',').filter(Boolean)), [prefRaw])
  const minFw = parseInt(searchParams.get('minfw') ?? '0', 10) || 0
  const maxFw = parseInt(searchParams.get('maxfw') ?? '0', 10) || 0
  const { festivalIds, datesOf, loaded } = useFavorites()
  const { homeBase } = useHomeBase()

  const list = useMemo(() => {
    let l = festivals
    if (tab === 'favorites') {
      if (!loaded) return []
      l = l.filter(f => festivalIds.has(f.id))
    } else {
      l = l.filter(f => tierSet.has(f.tier ?? 'unverified') || (!f.tier && tierSet.has('s')))
    }
    if (tab !== 'favorites') {
      const todayStr = new Date().toISOString().slice(0, 10)
      l = l.filter(f => {
        const y = f.festival_years?.[0]
        if (!y || !y.date) return dstatusSet.has('undetermined')
        if (isEnded(y, todayStr)) return dstatusSet.has('ended')
        return y.date_confirmed ? dstatusSet.has('confirmed') : dstatusSet.has('estimated')
      })
    }
    if (q) l = l.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.prefecture.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q)
    )
    if (sourceSet.size > 0) l = l.filter(f => (f.sources ?? []).some(s => sourceSet.has(s)))
    if (prefSet.size > 0) l = l.filter(f => prefSet.has(f.prefecture))
    if (minFw > 0 || maxFw > 0) {
      l = l.filter(f => {
        const fc = f.festival_years?.[0]?.fireworks_count
        if (fc == null) return false
        if (minFw > 0 && fc < minFw) return false
        if (maxFw > 0 && fc >= maxFw) return false
        return true
      })
    }
    if (month) {
      const m = parseInt(month, 10)
      l = l.filter(f => {
        const y = f.festival_years?.[0]
        if (!y) return false
        return collectDates(y).some(d => new Date(d).getMonth() + 1 === m)
      })
    }
    if (from || to) {
      l = l.filter(f => {
        const y = f.festival_years?.[0]
        if (!y) return false
        return collectDates(y).some(d => {
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
          return new Date(p.lottery_start_at) <= now && (!p.lottery_end_at || new Date(p.lottery_end_at) > now)
        })
      })
    }
    // ソート
    if (sort === 'date') {
      const keyOf = (f: FestivalWithYears) => {
        if (tab === 'favorites') {
          const ds = datesOf(f.id)
          if (ds.length > 0) return ds[0]
        }
        return f.festival_years?.[0]?.date ?? '9999'
      }
      l = [...l].sort((a, b) => keyOf(a).localeCompare(keyOf(b)))
    } else if (sort === 'fireworks') {
      l = [...l].sort((a, b) => (b.festival_years?.[0]?.fireworks_count ?? 0) - (a.festival_years?.[0]?.fireworks_count ?? 0))
    } else if (sort === 'attendance') {
      l = [...l].sort((a, b) => (b.festival_years?.[0]?.expected_attendance ?? 0) - (a.festival_years?.[0]?.expected_attendance ?? 0))
    } else if (sort === 'shell') {
      l = [...l].sort((a, b) => shellSizeNumeric(b.festival_years?.[0]?.max_shell_size) - shellSizeNumeric(a.festival_years?.[0]?.max_shell_size))
    } else if (sort === 'distance' && homeBase) {
      l = [...l].sort((a, b) => {
        const da = (a.lat && a.lng) ? haversineKm(homeBase.lat, homeBase.lng, a.lat, a.lng) : Infinity
        const db = (b.lat && b.lng) ? haversineKm(homeBase.lat, homeBase.lng, b.lat, b.lng) : Infinity
        return da - db
      })
    }
    return l
  }, [festivals, tab, sort, filter, month, from, to, tierSet, dstatusSet, q, sourceSet, prefSet, minFw, maxFw, festivalIds, datesOf, loaded, homeBase])

  return { list, tab, sort, homeBase }
}
