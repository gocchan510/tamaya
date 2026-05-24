'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const MONTHS = [5, 6, 7, 8, 9, 10, 11] as const

export function MonthFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const month = searchParams.get('month')
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const update = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const selectMonth = (m: number | null) => {
    update({ month: m === null ? null : String(m), from: null, to: null })
  }

  const baseBtn = 'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap'
  const inactive = 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
  const active = 'bg-amber-400/90 text-night-950 border-amber-400/90'
  const customActive = from || to

  const dateInputCls = 'bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white/80 [color-scheme:dark] focus:outline-none focus:border-amber-400/40'

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* 月クイック */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
        <button
          onClick={() => selectMonth(null)}
          disabled={isPending}
          className={`${baseBtn} ${!month && !customActive ? active : inactive}`}
        >
          全て
        </button>
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => selectMonth(m)}
            disabled={isPending}
            className={`${baseBtn} ${month === String(m) ? active : inactive}`}
          >
            {m}月
          </button>
        ))}
      </div>
      {/* 日付範囲 */}
      <div className={`flex items-center gap-1.5 text-xs ${customActive ? 'text-white/80' : 'text-white/40'}`}>
        <input
          type="date"
          value={from}
          min="2026-01-01"
          max="2026-12-31"
          onChange={e => update({ from: e.target.value || null, month: null })}
          disabled={isPending}
          className={dateInputCls}
        />
        <span>〜</span>
        <input
          type="date"
          value={to}
          min="2026-01-01"
          max="2026-12-31"
          onChange={e => update({ to: e.target.value || null, month: null })}
          disabled={isPending}
          className={dateInputCls}
        />
        {customActive && (
          <button
            onClick={() => update({ from: null, to: null })}
            disabled={isPending}
            className="ml-1 text-white/30 hover:text-white/60 transition-colors text-base leading-none"
            aria-label="日付範囲をクリア"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
