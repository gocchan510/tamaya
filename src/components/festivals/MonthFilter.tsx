'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function MonthFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
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

  const customActive = from || to
  const dateInputCls = 'bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white/80 [color-scheme:dark] focus:outline-none focus:border-amber-400/40'

  return (
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
  )
}
