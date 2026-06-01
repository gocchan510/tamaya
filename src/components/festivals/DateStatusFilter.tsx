'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const STATUSES = [
  { key: 'confirmed',    label: '✓ 確定', cls: 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-night-950 shadow-[0_2px_12px_rgba(16,185,129,0.22)]' },
  { key: 'estimated',    label: '▲ 推定', cls: 'bg-gradient-to-r from-amber-400 to-amber-300 text-night-950 shadow-[0_2px_12px_rgba(251,191,36,0.22)]' },
  { key: 'undetermined', label: '? 未定', cls: 'bg-white/25 text-white' },
  { key: 'ended',        label: '🏁 終了', cls: 'bg-white/12 text-white/65' },
] as const

const DEFAULT = 'confirmed,estimated,undetermined'

export function DateStatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const raw = searchParams.get('dstatus') ?? DEFAULT
  const active = new Set(raw.split(',').filter(Boolean))

  const toggle = (key: string) => {
    const next = new Set(active)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) params.delete('dstatus')
    else params.set('dstatus', [...next].join(','))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const inactive = 'bg-white/5 text-white/45 hover:text-white/85 hover:bg-white/10'
  const baseBtn = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap'

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {STATUSES.map(s => (
        <button
          key={s.key}
          onClick={() => toggle(s.key)}
          disabled={isPending}
          className={`${baseBtn} ${active.has(s.key) ? s.cls : inactive}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
