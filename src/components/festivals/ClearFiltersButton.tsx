'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

/**
 * すべての絞り込み（q含む）を解除して tab だけ残すボタン。
 * 空状態などで使う。
 */
export function ClearFiltersButton({ label = 'すべての絞り込みを解除' }: { label?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const clear = () => {
    const params = new URLSearchParams()
    const tab = searchParams.get('tab')
    if (tab) params.set('tab', tab)
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <button
      onClick={clear}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-amber-400/90 text-night-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
    >
      ✕ {label}
    </button>
  )
}
