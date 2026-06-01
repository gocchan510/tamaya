'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { useHomeBase } from '@/hooks/useHomeBase'
import dayjs from 'dayjs'

export function NearbyButton() {
  const { homeBase } = useHomeBase()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  if (!homeBase) return null

  const today = dayjs()
  const sat = today.day(6).format('YYYY-MM-DD')
  const sun = today.day(6).add(1, 'day').format('YYYY-MM-DD')

  const isActive =
    searchParams.get('sort') === 'distance' &&
    searchParams.get('from') === sat &&
    searchParams.get('to') === sun

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive) {
      params.delete('sort')
      params.delete('from')
      params.delete('to')
    } else {
      params.set('sort', 'distance')
      params.set('from', sat)
      params.set('to', sun)
      params.delete('tab')
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 border ${
        isActive
          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
          : 'bg-white/[0.04] text-white/60 border-white/10 hover:text-white/90 hover:bg-white/[0.07] hover:border-white/20'
      }`}
    >
      <span className="text-base">📍</span>
      <span>
        {isActive ? '解除' : `${homeBase.label}から近い・今週末`}
      </span>
      {isActive && <span className="text-xs text-amber-400/60">✓ 適用中</span>}
    </button>
  )
}
