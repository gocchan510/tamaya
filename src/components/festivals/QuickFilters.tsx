'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import dayjs from 'dayjs'

/**
 * 「近い大会を一発で」用のクイック期間チップ。
 * from/to をセットして FestivalList / EventCalendar の既存期間フィルタに乗せる。
 * 再タップで解除。月フィルタとは排他（month を消す）。
 */
export function QuickFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const today = dayjs()
  // 今週の土曜（週開始=日曜）。今日が日曜なら同週の到来する土曜
  const thisSat = today.day(6)
  const thisSun = thisSat.add(1, 'day')

  const ranges = [
    { key: 'weekend', label: '今週末', from: thisSat, to: thisSun },
    { key: 'nextweekend', label: '来週末', from: thisSat.add(7, 'day'), to: thisSun.add(7, 'day') },
    { key: 'thismonth', label: '今月', from: today.startOf('month'), to: today.endOf('month') },
    { key: 'nextmonth', label: '来月', from: today.add(1, 'month').startOf('month'), to: today.add(1, 'month').endOf('month') },
  ] as const

  const curFrom = searchParams.get('from')
  const curTo = searchParams.get('to')

  const apply = (from: dayjs.Dayjs, to: dayjs.Dayjs) => {
    const f = from.format('YYYY-MM-DD')
    const t = to.format('YYYY-MM-DD')
    const params = new URLSearchParams(searchParams.toString())
    const isActive = curFrom === f && curTo === t
    if (isActive) {
      params.delete('from')
      params.delete('to')
    } else {
      params.set('from', f)
      params.set('to', t)
      params.delete('month') // 月フィルタと排他
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      <span className="text-[10px] text-white/30 mr-0.5">📅 すぐ行ける</span>
      {ranges.map(r => {
        const f = r.from.format('YYYY-MM-DD')
        const t = r.to.format('YYYY-MM-DD')
        const active = curFrom === f && curTo === t
        return (
          <button
            key={r.key}
            onClick={() => apply(r.from, r.to)}
            disabled={isPending}
            className={`pill whitespace-nowrap ${active ? 'pill-active' : ''}`}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )
}
