'use client'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

type Suggestion = { id: string; name: string; prefecture: string; city: string; tier: string | null }

export function SearchBox({ candidates }: { candidates: Suggestion[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 300ms debounce で URL 反映
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) params.set('q', value.trim())
      else params.delete('q')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // 候補リスト：部分一致 上位8件
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return candidates
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.prefecture.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [value, candidates])

  // 外側クリックで閉じる
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // キーボード
  const onKey = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault()
      router.push(`/festivals/${suggestions[focusIdx].id}`)
      setOpen(false)
    } else if (e.key === 'Escape') setOpen(false)
  }

  const tierBadge = (tier: string | null) => {
    const map: Record<string, string> = { xl: '🏆', l: '⭐', m: '◇', s: '・', unverified: '?' }
    return map[tier ?? 'unverified'] ?? ''
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={value}
        onChange={e => { setValue(e.target.value); setOpen(true); setFocusIdx(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="大会名・地名で検索"
        className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-8 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.07] transition-colors"
        autoComplete="off"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">🔍</span>
      {value && (
        <button
          onClick={() => { setValue(''); setOpen(false) }}
          aria-label="クリア"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10"
        >
          ✕
        </button>
      )}
      {/* 候補ドロップダウン */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-white/15 overflow-hidden shadow-2xl backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(8, 8, 20, 0.96)' }}
        >
          {suggestions.map((s, i) => (
            <Link
              key={s.id}
              href={`/festivals/${s.id}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs transition-colors border-b border-white/5 last:border-b-0 ${
                i === focusIdx ? 'bg-amber-400/20' : 'hover:bg-white/8'
              }`}
            >
              <span className="text-[10px] w-4 shrink-0 text-center">{tierBadge(s.tier)}</span>
              <span className="text-white/50 shrink-0 text-[10px]">{s.prefecture}</span>
              <span className="text-white truncate">{s.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
