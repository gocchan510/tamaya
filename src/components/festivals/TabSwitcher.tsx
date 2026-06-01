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
            ? 'text-[#1a1208] bg-gradient-to-br from-gold-300 to-gold-400 shadow-[0_2px_12px_rgba(251,191,36,0.25)]'
            : 'text-white/55 hover:text-white/90'
        }`}
      >
        すべて
      </button>
      <button
        onClick={() => goto('favorites')}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          current === 'favorites'
            ? 'text-white bg-gradient-to-br from-pink-500 to-fuchsia-500 shadow-[0_2px_12px_rgba(236,72,153,0.3)]'
            : 'text-white/55 hover:text-white/90'
        }`}
      >
        <span>{current === 'favorites' ? '❤️' : '🤍'}</span>
        お気に入り
        {loaded && count > 0 && (
          <span className={`text-xs ${current === 'favorites' ? 'text-white/75' : 'text-white/40'}`}>
            ({count})
          </span>
        )}
      </button>
    </div>
  )
}
