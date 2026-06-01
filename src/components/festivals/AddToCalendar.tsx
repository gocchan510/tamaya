'use client'
import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { googleCalUrl, buildICS, type CalEvent } from '@/lib/calendar'

dayjs.locale('ja')

type Props = {
  title: string
  /** 開催日（YYYY-MM-DD）の配列 */
  dates: string[]
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  details?: string | null
  uidBase: string
}

/**
 * Googleカレンダーへの追加（テンプレートURL）＋ .ics ダウンロード。
 * 認証不要・クライアント完結。複数日は日付メニューから選択、.ics は全日まとめて。
 */
export function AddToCalendar({ title, dates, startTime, endTime, location, details, uidBase }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (dates.length === 0) return null

  const mk = (date: string): CalEvent => ({ title, date, startTime, endTime, location, details })
  const single = dates.length === 1

  const downloadIcs = () => {
    const ics = buildICS(title, uidBase, dates.map(mk))
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const btnBase = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200'

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2 flex-wrap">
      {single ? (
        <a
          href={googleCalUrl(mk(dates[0]))}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} bg-gradient-to-r from-sky-500/25 to-violet-500/20 text-sky-200 border border-sky-400/30 hover:from-sky-500/35 hover:to-violet-500/30`}
        >
          📅 Googleカレンダーに追加
        </a>
      ) : (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className={`${btnBase} bg-gradient-to-r from-sky-500/25 to-violet-500/20 text-sky-200 border border-sky-400/30 hover:from-sky-500/35 hover:to-violet-500/30`}
          >
            📅 Googleカレンダーに追加
            <span className="text-sky-300/70">{open ? '▲' : '▼'}</span>
          </button>
          {open && (
            <div
              className="absolute z-50 top-full left-0 mt-1 rounded-xl border border-white/15 overflow-hidden shadow-2xl backdrop-blur-xl min-w-[180px]"
              style={{ backgroundColor: 'rgba(8, 8, 20, 0.96)' }}
            >
              <div className="px-3 py-2 text-[10px] text-white/40 border-b border-white/10">日付を選択</div>
              {dates.map(d => (
                <a
                  key={d}
                  href={googleCalUrl(mk(d))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-xs text-white/80 hover:bg-sky-500/15 hover:text-sky-200 transition-colors"
                >
                  {dayjs(d).format('M月D日（dd）')}
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={downloadIcs}
        className={`${btnBase} bg-white/5 text-white/55 border border-white/10 hover:text-white/85 hover:bg-white/10`}
        title="Apple / Outlook カレンダー用（全日分）"
      >
        ⬇ .ics
      </button>
    </div>
  )
}
