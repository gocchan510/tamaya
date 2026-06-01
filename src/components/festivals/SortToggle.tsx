'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const SORTS = [
  { key: 'ranking',    label: '規模順' },
  { key: 'fireworks',  label: '打上数' },
  { key: 'attendance', label: '来場者' },
  { key: 'shell',      label: '号数' },
  { key: 'distance',   label: '距離順' },
] as const

export function SortToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = searchParams.get('sort') ?? 'ranking'

  const set = (sort: string) => {
    // 距離順はフィルタ維持、それ以外はフィルタリセット
    const params = sort === 'distance'
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams()
    if (sort !== 'ranking') params.set('sort', sort)
    else params.delete('sort')
    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
    })
  }

  return (
    <div className="flex items-center gap-1 glass rounded-full p-1 overflow-x-auto max-w-full">
      {SORTS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => set(key)}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            current === key
              ? 'text-[#1a1208] bg-gradient-to-br from-gold-300 to-gold-400 shadow-[0_2px_12px_rgba(251,191,36,0.25)]'
              : 'text-white/55 hover:text-white/90'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
