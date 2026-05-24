'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function SortToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = searchParams.get('sort') ?? 'ranking'

  const toggle = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-1 glass rounded-full p-1">
      {[
        { key: 'ranking', label: '人気順' },
        { key: 'date',    label: '日程順' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          disabled={isPending}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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
