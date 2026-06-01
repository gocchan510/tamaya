'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * カレンダー（12ヶ月グリッド）を画面右下に常駐するフローティングボタンで開閉する。
 * 一覧をファーストビューから押し下げないよう、既定で閉じ、押すとモーダル
 * オーバーレイで全幅表示する。期間（from/to）または月（month）指定中はバッジを出す。
 */
export function CalendarDisclosure({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const hasDate = !!(searchParams.get('from') || searchParams.get('to') || searchParams.get('month'))

  // Escape で閉じる + 開いている間は背景スクロールを止める
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      {/* 右下フローティングボタン（常時表示） */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="カレンダーで探す"
        className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium shadow-2xl border backdrop-blur-md transition-all duration-200 ${
          hasDate
            ? 'bg-sky-500/90 text-white border-sky-300/50'
            : 'bg-night-950/90 text-amber-200 border-amber-400/40 hover:bg-night-900/90 hover:border-amber-400/60'
        }`}
      >
        <span className="text-base">📅</span>
        <span className="hidden sm:inline">カレンダーで探す</span>
        {hasDate && (
          <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-white text-sky-700 text-[10px] font-bold">
            日付
          </span>
        )}
      </button>

      {/* モーダルオーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          {/* 上部に閉じるバー（sticky） */}
          <div className="sticky top-0 z-10 flex justify-end px-4 py-3">
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 backdrop-blur-md transition-colors"
            >
              ✕ 閉じる
            </button>
          </div>
          {/* カレンダー本体（クリックが背景に伝播して閉じないよう stopPropagation） */}
          <div className="pb-16" onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>
      )}
    </>
  )
}
