'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useMemo } from 'react'

export function PrefectureFilter({ available }: { available: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const raw = searchParams.get('pref') ?? ''
  const active = useMemo(() => new Set(raw.split(',').filter(Boolean)), [raw])

  // 関東優先、それ以外は末尾
  const order = ['東京都', '神奈川県', '千葉県', '埼玉県', '茨城県', '栃木県', '群馬県']
  const sorted = [...available].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia < 0 && ib < 0) return a.localeCompare(b)
    if (ia < 0) return 1
    if (ib < 0) return -1
    return ia - ib
  })

  const toggle = (pref: string) => {
    const next = new Set(active)
    if (next.has(pref)) next.delete(pref)
    else next.add(pref)
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) params.delete('pref')
    else params.set('pref', [...next].join(','))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const baseBtn = 'inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap'
  const inactive = 'bg-white/5 text-white/45 hover:text-white/85 hover:bg-white/10'
  const activeCls = 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_2px_12px_rgba(167,139,250,0.25)]'

  // 簡略表示用（「県」「都」「府」を除く）
  const shortName = (p: string) => p.replace(/[都府県]$/, '')

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
      {active.size > 0 && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('pref')
            startTransition(() => router.push(`${pathname}?${params.toString()}`))
          }}
          disabled={isPending}
          className={`${baseBtn} ${inactive}`}
        >
          全て
        </button>
      )}
      {sorted.map(p => (
        <button
          key={p}
          onClick={() => toggle(p)}
          disabled={isPending}
          className={`${baseBtn} ${active.has(p) ? activeCls : inactive}`}
        >
          {shortName(p)}
        </button>
      ))}
    </div>
  )
}
