'use client'
import { useFavorites } from '@/hooks/useFavorites'

export function FavoriteButton({ festivalId, size = 'md' }: { festivalId: string; size?: 'sm' | 'md' }) {
  const { isFav, toggle, loaded } = useFavorites()
  const active = loaded && isFav(festivalId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(festivalId)
  }

  const sizeClasses = size === 'sm'
    ? 'w-7 h-7 text-base'
    : 'w-9 h-9 text-xl'

  return (
    <button
      onClick={handleClick}
      aria-label={active ? 'お気に入り解除' : 'お気に入り追加'}
      className={`${sizeClasses} shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
        active
          ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 hover:scale-110'
          : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
      }`}
      style={{ visibility: loaded ? 'visible' : 'hidden' }}
    >
      {active ? '♥' : '♡'}
    </button>
  )
}
