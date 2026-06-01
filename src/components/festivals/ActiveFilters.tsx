'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import dayjs from 'dayjs'

const TIER_DEFAULT = 'xl,l,m,s,unverified'
const DSTATUS_DEFAULT = 'confirmed,estimated,undetermined'

const TIER_LABEL: Record<string, string> = { xl: 'XL', l: 'L', m: 'M', s: 'S', unverified: '不明' }
const DSTATUS_LABEL: Record<string, string> = { confirmed: '確定', estimated: '推定', undetermined: '未定', ended: '終了' }

function fmtCount(n: number): string {
  if (n >= 10000) return `${n / 10000}万`
  if (n >= 1000) return `${n / 1000}千`
  return String(n)
}

/** アクティブなフィルタを個別に外せるチップ列。折りたたみが閉じていても可視化される。 */
export function ActiveFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const push = (params: URLSearchParams) =>
    startTransition(() => router.push(`${pathname}?${params.toString()}`))

  // パラメータをまるごと消す
  const removeParam = (...keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    keys.forEach(k => params.delete(k))
    push(params)
  }
  // カンマ区切りの1値だけ消す
  const removeValue = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const next = (params.get(key) ?? '').split(',').filter(v => v && v !== value)
    if (next.length) params.set(key, next.join(','))
    else params.delete(key)
    push(params)
  }

  type Chip = { label: string; onRemove: () => void }
  const chips: Chip[] = []

  // 検索キーワード
  const q = (searchParams.get('q') ?? '').trim()
  if (q) chips.push({ label: `検索「${q}」`, onRemove: () => removeParam('q') })
  // 規模（デフォルトと異なる場合のみ）
  const tier = searchParams.get('tier')
  if (tier && tier !== TIER_DEFAULT) {
    const labels = tier.split(',').filter(Boolean).map(t => TIER_LABEL[t] ?? t).join('・')
    chips.push({ label: `規模 ${labels}`, onRemove: () => removeParam('tier') })
  }
  // 日程ステータス（デフォルトと異なる場合のみ）
  const dstatus = searchParams.get('dstatus')
  if (dstatus && dstatus !== DSTATUS_DEFAULT) {
    const labels = dstatus.split(',').filter(Boolean).map(d => DSTATUS_LABEL[d] ?? d).join('・')
    chips.push({ label: `日程 ${labels}`, onRemove: () => removeParam('dstatus') })
  }
  // 都道府県（1つずつ）
  const pref = searchParams.get('pref')
  if (pref) pref.split(',').filter(Boolean).forEach(p =>
    chips.push({ label: p, onRemove: () => removeValue('pref', p) })
  )
  // 打上数帯
  const minFw = parseInt(searchParams.get('minfw') ?? '0', 10) || 0
  const maxFw = parseInt(searchParams.get('maxfw') ?? '0', 10) || 0
  if (minFw > 0 || maxFw > 0) {
    const label = maxFw === 0 ? `${fmtCount(minFw)}+`
      : minFw === 0 ? `〜${fmtCount(maxFw)}`
      : `${fmtCount(minFw)}〜${fmtCount(maxFw)}`
    chips.push({ label: `打上 ${label}発`, onRemove: () => removeParam('minfw', 'maxfw') })
  }
  // ソース（1つずつ）
  const source = searchParams.get('source')
  if (source) source.split(',').filter(Boolean).forEach(s =>
    chips.push({ label: s, onRemove: () => removeValue('source', s) })
  )
  // 月
  const month = searchParams.get('month')
  if (month) chips.push({ label: `${month}月`, onRemove: () => removeParam('month') })
  // 期間
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (from || to) {
    const f = from ? dayjs(from).format('M/D') : ''
    const t = to ? dayjs(to).format('M/D') : ''
    chips.push({ label: from && to ? (f === t ? f : `${f}〜${t}`) : f || `〜${t}`, onRemove: () => removeParam('from', 'to') })
  }
  // 受付中のみ
  if (searchParams.get('filter') === 'open') {
    chips.push({ label: '受付中のみ', onRemove: () => removeParam('filter') })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={c.onRemove}
          disabled={isPending}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-400/15 text-amber-200 border border-amber-400/30 hover:bg-amber-400/25 transition-colors"
        >
          {c.label}
          <span className="text-amber-300/70">✕</span>
        </button>
      ))}
    </div>
  )
}
