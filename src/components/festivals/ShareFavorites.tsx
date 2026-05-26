'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useFavorites } from '@/hooks/useFavorites'

// entries (Set<string>) → URL share param
function encodeEntries(entries: Set<string>): string {
  const joined = [...entries].join(',')
  // base64url（URL に安全）
  const b64 = typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(joined)))
    : Buffer.from(joined, 'utf8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeEntries(param: string): string[] {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const decoded = typeof window !== 'undefined'
      ? decodeURIComponent(escape(window.atob(padded)))
      : Buffer.from(padded, 'base64').toString('utf8')
    if (!decoded) return []
    // 形式チェック: festivalId|YYYY-MM-DD
    return decoded.split(',').filter(s => /^[0-9a-f-]{36}\|\d{4}-\d{2}-\d{2}$/i.test(s))
  } catch {
    return []
  }
}

/** お気に入り共有URL生成ボタン */
export function ShareFavoritesButton() {
  const { entries, count, loaded } = useFavorites()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(async () => {
    if (!entries.size) {
      alert('お気に入りが0件です')
      return
    }
    const encoded = encodeEntries(entries)
    // localhost からでも本番URLとして共有できるように、本番origin固定
    // 本番にいる時は現在のoriginを使う（PRプレビュー等も追従）
    const base = window.location.host.includes('localhost')
      ? 'https://tamaya-iota.vercel.app'
      : window.location.origin
    const url = `${base}/?fav=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard が使えない環境（http や古いブラウザ）はプロンプトで見せる
      window.prompt('共有URL:', url)
    }
  }, [entries])

  if (!loaded || count === 0) return null

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
        copied
          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50'
          : 'bg-white/5 text-white/50 border-white/15 hover:text-white/85 hover:border-white/30'
      }`}
      title="お気に入り共有URLをコピー"
    >
      {copied ? '✓ コピーしました' : `🔗 共有URLをコピー (${count})`}
    </button>
  )
}

/** ?fav= があれば受け取って既存fav とマージ */
export function FavoritesImporter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { entries, toggle, loaded } = useFavorites()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || !loaded) return
    const param = searchParams.get('fav')
    if (!param) return
    handled.current = true

    const incoming = decodeEntries(param)
    if (incoming.length === 0) {
      // 無効なパラメータは黙って削除
      const p = new URLSearchParams(searchParams.toString())
      p.delete('fav')
      router.replace(p.toString() ? `${pathname}?${p.toString()}` : pathname)
      return
    }

    const newOnes = incoming.filter(k => !entries.has(k))
    const dupCount = incoming.length - newOnes.length

    const msg = newOnes.length === 0
      ? `共有された ${incoming.length} 件すべて既に登録済みです。\nURL を片付けますか？`
      : `共有お気に入り ${incoming.length} 件のうち、新規 ${newOnes.length} 件${dupCount > 0 ? `（重複 ${dupCount} 件は無視）` : ''} を取り込みますか？`

    const ok = window.confirm(msg)
    if (ok && newOnes.length > 0) {
      for (const k of newOnes) {
        const i = k.indexOf('|')
        if (i <= 0) continue
        toggle(k.slice(0, i), k.slice(i + 1))
      }
    }
    // 取り込み有無に関わらずURLから掃除
    const p = new URLSearchParams(searchParams.toString())
    p.delete('fav')
    router.replace(p.toString() ? `${pathname}?${p.toString()}` : pathname)
  }, [searchParams, loaded, entries, toggle, router, pathname])

  return null
}
