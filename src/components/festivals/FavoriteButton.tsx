'use client'
import { useFavorites } from '@/hooks/useFavorites'
import dayjs from 'dayjs'

type Props = {
  festivalId: string
  date: string // YYYY-MM-DD
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean // M/D ラベルを表示
}

export function FavoriteButton({ festivalId, date, size = 'md', showLabel = false }: Props) {
  const { isFav, toggle, loaded } = useFavorites()
  const active = loaded && isFav(festivalId, date)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(festivalId, date)
  }

  const sizeClasses =
    size === 'xs' ? 'h-6 px-2 text-[11px]'
    : size === 'sm' ? 'h-7 px-2.5 text-xs'
    : 'h-9 px-3 text-sm'

  const label = showLabel ? dayjs(date).format('M/D') : ''

  return (
    <button
      onClick={handleClick}
      aria-label={active ? `${label || 'お気に入り'}を解除` : `${label || 'お気に入り'}を追加`}
      className={`${sizeClasses} shrink-0 rounded-full inline-flex items-center gap-1 transition-all duration-200 ${
        active
          ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40 hover:bg-pink-500/30'
          : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
      }`}
      style={{ visibility: loaded ? 'visible' : 'hidden' }}
    >
      <span>{active ? '♥' : '♡'}</span>
      {showLabel && <span className="font-medium">{label}</span>}
    </button>
  )
}
