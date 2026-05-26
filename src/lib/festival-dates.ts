import type { FestivalYear } from '@/types'

/** 大会の festival_year に基づき、指定日が開催日かを判定 */
export function yearHasDate(y: FestivalYear | null | undefined, ymd: string): boolean {
  if (!y) return false
  if (y.event_dates && y.event_dates.length > 0) return y.event_dates.includes(ymd)
  if (!y.date) return false
  if (!y.end_date) return y.date === ymd
  return ymd >= y.date && ymd <= y.end_date
}

/** 大会の全開催日（YYYY-MM-DD）を列挙 */
export function listEventDates(y: FestivalYear | null | undefined): string[] {
  if (!y) return []
  if (y.event_dates && y.event_dates.length > 0) return [...y.event_dates]
  if (!y.date) return []
  if (!y.end_date) return [y.date]
  const out: string[] = []
  for (let d = new Date(y.date); d <= new Date(y.end_date); d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
