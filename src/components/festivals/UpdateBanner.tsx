'use client'
import { useEffect, useState } from 'react'

const KEY = 'tamaya:seen-update'

export function UpdateBanner({ date, text, sha }: { date: string; text: string; sha?: string }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === date)
    } catch {
      setDismissed(false)
    }
  }, [date])

  if (dismissed) return null

  const close = () => {
    try { localStorage.setItem(KEY, date) } catch {}
    setDismissed(true)
  }

  return (
    <div className="mt-5 mx-auto max-w-md flex items-center gap-3 glass rounded-2xl px-4 py-3 text-left">
      <span className="text-lg shrink-0">🎆</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-amber-400/70 font-medium tracking-wide">
          更新 {date}{sha ? ` · ${sha}` : ''}
        </p>
        <p className="text-xs text-white/70 leading-snug mt-0.5">{text}</p>
      </div>
      <button
        onClick={close}
        aria-label="閉じる"
        className="text-white/30 hover:text-white/70 text-sm shrink-0 px-1 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
