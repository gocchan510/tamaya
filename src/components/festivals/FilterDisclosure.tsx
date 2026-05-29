'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'

const TIER_DEFAULT = 'xl,l,m,s,unverified'
const DSTATUS_DEFAULT = 'confirmed,estimated,undetermined'

/**
 * 絞り込みフィルタ群を折りたたみ式にまとめるコンテナ。
 * 検索・ソート・カレンダーは常時表示のままで、規模/県/打上数/日程ステータス/
 * ソース/期間/受付中 などはこの中に格納する（デフォルト閉じ）。
 * アクティブなフィルタ数をバッジ表示し、ワンタップで全解除できる。
 */
export function FilterDisclosure({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // アクティブなフィルタ数を算出（デフォルト値と異なるものをカウント）
  const tier = searchParams.get('tier')
  const dstatus = searchParams.get('dstatus')
  let count = 0
  if (tier && tier !== TIER_DEFAULT) count++
  if (dstatus && dstatus !== DSTATUS_DEFAULT) count++
  if (searchParams.get('pref')) count++
  if (searchParams.get('source')) count++
  if ((parseInt(searchParams.get('minfw') ?? '0', 10) || 0) > 0 ||
      (parseInt(searchParams.get('maxfw') ?? '0', 10) || 0) > 0) count++
  if (searchParams.get('month')) count++
  if (searchParams.get('from') || searchParams.get('to')) count++
  if (searchParams.get('filter') === 'open') count++

  // 全フィルタ解除（tab / q / sort は維持）
  const clearAll = () => {
    const params = new URLSearchParams()
    const keep = ['tab', 'q', 'sort']
    for (const k of keep) {
      const v = searchParams.get(k)
      if (v) params.set(k, v)
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            count > 0
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
              : 'bg-white/5 text-white/60 border-white/10 hover:text-white/90 hover:border-white/20'
          }`}
        >
          <span>絞り込み</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-400 text-night-950 text-[10px] font-bold">
              {count}
            </span>
          )}
          <span className="text-white/50">{open ? '▲' : '▼'}</span>
        </button>
        {count > 0 && (
          <button
            onClick={clearAll}
            disabled={isPending}
            className="text-[11px] text-white/40 hover:text-white/80 underline underline-offset-2 transition-colors"
          >
            全解除
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col items-center gap-3 w-full">
          {children}
        </div>
      )}
    </div>
  )
}
