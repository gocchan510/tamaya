'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const TIERS = [
  { key: 'xl', label: '🏆 大規模', cls: 'bg-amber-400/90 text-night-950 border-amber-400/90' },
  { key: 'l',  label: '⭐ 中規模', cls: 'bg-sky-500/90 text-night-950 border-sky-500/90' },
  { key: 'm',  label: '◇ 小規模', cls: 'bg-white/30 text-white/90 border-white/40' },
  { key: 's',  label: '・ 極小',   cls: 'bg-white/15 text-white/80 border-white/20' },
  { key: 'unverified', label: '? 規模不明', cls: 'bg-purple-500/30 text-purple-200 border-purple-400/40' },
] as const

export function TierFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const raw = searchParams.get('tier') ?? 'xl,l' // デフォルト XL+L
  const active = new Set(raw.split(',').filter(Boolean))

  const toggle = (key: string) => {
    const next = new Set(active)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) params.delete('tier')
    else params.set('tier', [...next].join(','))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const inactive = 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
  const baseBtn = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap'

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {TIERS.map(t => (
        <button
          key={t.key}
          onClick={() => toggle(t.key)}
          disabled={isPending}
          className={`${baseBtn} ${active.has(t.key) ? t.cls : inactive}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
