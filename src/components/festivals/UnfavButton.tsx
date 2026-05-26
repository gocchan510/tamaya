'use client'
import { useFavorites } from '@/hooks/useFavorites'
import dayjs from 'dayjs'

export function UnfavButton({ festivalId, date }: { festivalId: string; date: string }) {
  const { toggle, loaded } = useFavorites()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const label = dayjs(date).format('M/D')
    if (window.confirm(`${label} のお気に入りを本当に解除しますか？`)) {
      toggle(festivalId, date)
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`${dayjs(date).format('M/D')} のお気に入りを解除`}
      className="w-full h-6 px-2 text-[11px] rounded-full inline-flex items-center justify-center gap-1 bg-pink-500/20 text-pink-300 border border-pink-400/40 hover:bg-pink-500/40 hover:text-pink-200 transition-colors"
      style={{ visibility: loaded ? 'visible' : 'hidden' }}
    >
      <span>♥</span>
      <span>解除</span>
    </button>
  )
}
