'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function DebugToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const on = searchParams.get('debug') === '1'

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (on) params.delete('debug')
    else params.set('debug', '1')
    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
        on
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
          : 'bg-white/5 text-white/30 border-white/10 hover:text-white/60'
      }`}
      aria-pressed={on}
      title="ソースバッジ等の開発者向け情報を表示"
    >
      {on ? '🐛 DEBUG ON' : '🐛 debug'}
    </button>
  )
}
