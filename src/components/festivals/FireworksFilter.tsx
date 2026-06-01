'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

// 打上数の帯（range）。min は含む / max は含まない（排他）。max:null は上限なし。
const BANDS = [
  { key: 'a', label: '〜5千',   min: 0,     max: 5000 },
  { key: 'b', label: '5千〜1万', min: 5000,  max: 10000 },
  { key: 'c', label: '1万〜2万', min: 10000, max: 20000 },
  { key: 'd', label: '2万〜3万', min: 20000, max: 30000 },
  { key: 'e', label: '3万+',    min: 30000, max: null },
] as const

export function FireworksFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const curMin = parseInt(searchParams.get('minfw') ?? '0', 10) || 0
  const curMax = parseInt(searchParams.get('maxfw') ?? '0', 10) || 0

  const set = (band: typeof BANDS[number]) => {
    const params = new URLSearchParams(searchParams.toString())
    const active = curMin === band.min && curMax === (band.max ?? 0)
    if (active) {
      params.delete('minfw')
      params.delete('maxfw')
    } else {
      if (band.min > 0) params.set('minfw', String(band.min))
      else params.delete('minfw')
      if (band.max != null) params.set('maxfw', String(band.max))
      else params.delete('maxfw')
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      <span className="text-[10px] text-white/30 mr-1">打上数</span>
      {BANDS.map(b => {
        const active = curMin === b.min && curMax === (b.max ?? 0)
        return (
          <button
            key={b.key}
            onClick={() => set(b)}
            disabled={isPending}
            className={`pill whitespace-nowrap ${active ? 'pill-active' : ''} disabled:opacity-100`}
          >
            {b.label}
          </button>
        )
      })}
    </div>
  )
}
