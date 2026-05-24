'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const STATUSES = [
  { key: 'confirmed',    label: '✓ 確定', cls: 'bg-emerald-500/90 text-night-950 border-emerald-500/90' },
  { key: 'estimated',    label: '▲ 推定', cls: 'bg-amber-400/90 text-night-950 border-amber-400/90' },
  { key: 'undetermined', label: '? 未定', cls: 'bg-white/30 text-white/90 border-white/40' },
  { key: 'ended',        label: '🏁 終了', cls: 'bg-white/15 text-white/60 border-white/25' },
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

  const inactive = 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
  const baseBtn = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap'

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
