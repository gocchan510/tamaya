'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function FilterToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const active = searchParams.get('filter') === 'open'

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (active) params.delete('filter')
    else params.set('filter', 'open')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
        active
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
      }`}
    >
      <span className={active ? 'animate-pulse' : ''}>●</span>
      受付中のみ
    </button>
  )
}
