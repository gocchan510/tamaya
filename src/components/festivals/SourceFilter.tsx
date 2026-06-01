'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'

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
  { key: 'l_tike',     label: 'ローチケ',  cls: 'bg-blue-500/90 text-white border-blue-500/90' },
  { key: 'fany',       label: 'FANY',     cls: 'bg-pink-500/90 text-white border-pink-500/90' },
  { key: 'cn_play',    label: 'CNプレイ', cls: 'bg-emerald-600/90 text-white border-emerald-600/90' },
  { key: 'enka_kyokai',label: '煙火協会', cls: 'bg-orange-600/90 text-white border-orange-600/90' },
  { key: 'four_travel',label: '4travel',  cls: 'bg-amber-600/90 text-white border-amber-600/90' },
  { key: 'hanabi_cloud',label: '花火クラウド', cls: 'bg-violet-400/90 text-night-950 border-violet-400/90' },
  { key: 'asoview',    label: 'asoview', cls: 'bg-yellow-400/90 text-night-950 border-yellow-400/90' },
  { key: 'ikyu',       label: '一休',     cls: 'bg-zinc-300/90 text-night-950 border-zinc-300/90' },
  { key: 'local_news', label: '地方紙',   cls: 'bg-stone-500/90 text-white border-stone-500/90' },
  { key: 'seven_ticket',    label: 'セブン',  cls: 'bg-orange-500/90 text-night-950 border-orange-500/90' },
  { key: 'rakuten_ticket',  label: '楽天チケ', cls: 'bg-red-700/90 text-white border-red-700/90' },
  { key: 'rakuten_furusato',label: '楽天ふる', cls: 'bg-rose-600/90 text-white border-rose-600/90' },
  { key: 'satofull',        label: 'さとふる', cls: 'bg-sky-400/90 text-night-950 border-sky-400/90' },
  { key: 'jtb_tour',        label: 'JTB',     cls: 'bg-red-400/90 text-night-950 border-red-400/90' },
  { key: 'his_tour',        label: 'HIS',     cls: 'bg-yellow-600/90 text-white border-yellow-600/90' },
  { key: 'hankyu_tour',     label: '阪急',    cls: 'bg-amber-900/90 text-white border-amber-900/90' },
  { key: 'livepocket',      label: 'livepocket', cls: 'bg-purple-500/90 text-white border-purple-500/90' },
  { key: 'ticketrise',      label: 'TicketRise', cls: 'bg-teal-600/90 text-white border-teal-600/90' },
  { key: 'jre_mall',        label: 'JRE',     cls: 'bg-green-600/90 text-white border-green-600/90' },
  { key: 'univ_fest',       label: '大学祭',  cls: 'bg-pink-400/90 text-night-950 border-pink-400/90' },
] as const

export function SourceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
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

  const inactive = 'bg-white/5 text-white/45 hover:text-white/85 hover:bg-white/10'
  const baseBtn = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap'

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-2xl">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
        aria-expanded={open}
      >
        <span>ソース{active.size > 0 ? ` (${active.size})` : ''}</span>
        <span className="text-white/50">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
      )}
    </div>
  )
}
