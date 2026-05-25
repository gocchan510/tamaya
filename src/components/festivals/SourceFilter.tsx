'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const SOURCES = [
  { key: 'walkerplus', label: 'Walker+',  cls: 'bg-cyan-500/90 text-night-950 border-cyan-500/90' },
  { key: 'jalan',      label: 'じゃらん', cls: 'bg-orange-400/90 text-night-950 border-orange-400/90' },
  { key: 'rurubu',     label: 'るるぶ',   cls: 'bg-fuchsia-500/90 text-night-950 border-fuchsia-500/90' },
  { key: 'jorudan',    label: 'ジョルダン', cls: 'bg-green-500/90 text-night-950 border-green-500/90' },
  { key: 'ekitan',     label: '駅探',     cls: 'bg-rose-500/90 text-night-950 border-rose-500/90' },
  { key: 'sorahanabi', label: '空花火',   cls: 'bg-indigo-400/90 text-night-950 border-indigo-400/90' },
  { key: 'kankou',     label: '観光協会', cls: 'bg-yellow-500/90 text-night-950 border-yellow-500/90' },
  { key: 'furusato_choice', label: 'ふるさとチョイス', cls: 'bg-red-500/90 text-night-950 border-red-500/90' },
  { key: 'ticket_pia', label: 'チケットぴあ', cls: 'bg-red-600/90 text-white border-red-600/90' },
  { key: 'eplus',      label: 'イープラス', cls: 'bg-lime-500/90 text-night-950 border-lime-500/90' },
  { key: 'hanabier',   label: 'Hanabier', cls: 'bg-teal-500/90 text-night-950 border-teal-500/90' },
  { key: 'wikipedia',  label: 'Wikipedia', cls: 'bg-slate-400/90 text-night-950 border-slate-400/90' },
] as const

export function SourceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const raw = searchParams.get('source') ?? ''
  const active = new Set(raw.split(',').filter(Boolean))

  const toggle = (key: string) => {
    const next = new Set(active)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) params.delete('source')
    else params.set('source', [...next].join(','))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const inactive = 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
  const baseBtn = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap'

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      <span className="text-[10px] text-white/30 mr-1">ソース:</span>
      {SOURCES.map(s => (
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
