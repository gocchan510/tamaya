'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const SORTS = [
  { key: 'ranking',    label: '規模順' },
  { key: 'fireworks',  label: '打上数' },
  { key: 'attendance', label: '来場者' },
  { key: 'shell',      label: '号数' },
] as const

export function SortToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = searchParams.get('sort') ?? 'ranking'

  const set = (sort: string) => {
    // ソートはDB全体のランキング前提 → 全フィルタを解除してデフォルトに戻す
    const params = new URLSearchParams()
    if (sort !== 'ranking') params.set('sort', sort)
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
              ? 'bg-amber-400/90 text-night-950 shadow-sm'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
