'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { useFavorites } from '@/hooks/useFavorites'

export function TabSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = searchParams.get('tab') ?? 'all'
  const { count, loaded } = useFavorites()

  const goto = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'all') params.delete('tab')
    else params.set('tab', tab)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-1 glass rounded-full p-1">
      <button
        onClick={() => goto('all')}
        disabled={isPending}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          current === 'all'
            ? 'bg-amber-400/90 text-night-950 shadow-sm'
            : 'text-white/60 hover:text-white/90'
        }`}
      >
        すべて
      </button>
      <button
        onClick={() => goto('favorites')}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          current === 'favorites'
            ? 'bg-pink-500/90 text-night-950 shadow-sm'
            : 'text-white/60 hover:text-white/90'
        }`}
      >
        <span>{current === 'favorites' ? '♥' : '♡'}</span>
        お気に入り
        {loaded && count > 0 && (
          <span className={`text-xs ${current === 'favorites' ? 'text-night-950/70' : 'text-white/40'}`}>
            ({count})
          </span>
        )}
      </button>
    </div>
  )
}
