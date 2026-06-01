'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const TIERS = [
  { key: 'xl', label: '🏆 大規模', cls: 'bg-gradient-to-r from-amber-400 to-amber-300 text-night-950 shadow-[0_2px_12px_rgba(251,191,36,0.25)]' },
  { key: 'l',  label: '⭐ 中規模', cls: 'bg-gradient-to-r from-sky-500 to-sky-400 text-night-950 shadow-[0_2px_12px_rgba(56,189,248,0.22)]' },
  { key: 'm',  label: '◇ 小規模', cls: 'bg-white/25 text-white' },
  { key: 's',  label: '・ 極小',   cls: 'bg-white/12 text-white/85' },
  { key: 'unverified', label: '? 規模不明', cls: 'bg-purple-500/40 text-purple-100' },
] as const

export function TierFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const raw = searchParams.get('tier') ?? 'xl,l,m,s,unverified' // デフォルト全選択
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

  const inactive = 'bg-white/5 text-white/45 hover:text-white/85 hover:bg-white/10'
  const baseBtn = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap'

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
