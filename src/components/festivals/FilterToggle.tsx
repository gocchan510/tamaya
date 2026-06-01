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
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-400/20 text-emerald-200 shadow-[0_2px_12px_rgba(16,185,129,0.18)]'
          : 'bg-white/5 text-white/45 hover:text-white/85 hover:bg-white/10'
      }`}
    >
      <span className={active ? 'animate-pulse text-emerald-400' : 'text-white/40'}>●</span>
      受付中のみ
    </button>
  )
}
