// Googleカレンダー テンプレートURL & .ics 生成ヘルパー（OAuth不要・クライアント完結）

export type CalEvent = {
  title: string
  /** 開催日（YYYY-MM-DD） */
  date: string
  /** 'HH:MM' or 'HH:MM:SS'（無ければ終日扱い） */
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  details?: string | null
}

const TZ = 'Asia/Tokyo'

// 'HH:MM[:SS]' → 'HHMMSS'
function hms(t?: string | null): string | null {
  if (!t) return null
  const [h = '00', m = '00', s = '00'] = t.split(':')
  return `${h.padStart(2, '0')}${m.padStart(2, '0')}${s.padStart(2, '0')}`
}

// 'YYYY-MM-DD' → 'YYYYMMDD'
function ymd(d: string): string {
  return d.replace(/-/g, '')
}

// 終日: 翌日（DTEND は排他）
function nextDay(d: string): string {
  const dt = new Date(`${d}T00:00:00`)
  dt.setDate(dt.getDate() + 1)
  return dt.toISOString().slice(0, 10).replace(/-/g, '')
}

// 時刻あり: 終了が無ければ +2h
function plus2h(d: string, start: string): string {
  const sh = parseInt(start.slice(0, 2), 10)
  const rest = start.slice(2)
  const eh = Math.min(sh + 2, 23)
  return `${ymd(d)}T${String(eh).padStart(2, '0')}${rest}`
}

/** Googleカレンダー「予定を追加」画面を開くURL（1日分） */
export function googleCalUrl(e: CalEvent): string {
  const start = hms(e.startTime)
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', e.title)

  if (start) {
    const s = `${ymd(e.date)}T${start}`
    const end = e.endTime ? `${ymd(e.date)}T${hms(e.endTime)}` : plus2h(e.date, start)
    params.set('dates', `${s}/${end}`)
    params.set('ctz', TZ)
  } else {
    params.set('dates', `${ymd(e.date)}/${nextDay(e.date)}`)
  }
  if (e.location) params.set('location', e.location)
  if (e.details) params.set('details', e.details)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** 複数日まとめた .ics 文字列（Apple/Outlook等向け） */
export function buildICS(baseTitle: string, uidBase: string, events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tamaya//Fireworks Guide//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${TZ}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0900',
    'TZOFFSETTO:+0900',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]

  for (const e of events) {
    const start = hms(e.startTime)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uidBase}-${ymd(e.date)}@tamaya`)
    lines.push(`DTSTAMP:${stamp}`)
    if (start) {
      const end = e.endTime ? `${ymd(e.date)}T${hms(e.endTime)}` : plus2h(e.date, start)
      lines.push(`DTSTART;TZID=${TZ}:${ymd(e.date)}T${start}`)
      lines.push(`DTEND;TZID=${TZ}:${end}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`)
      lines.push(`DTEND;VALUE=DATE:${nextDay(e.date)}`)
    }
    lines.push(`SUMMARY:${icsEscape(e.title)}`)
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`)
    if (e.details) lines.push(`DESCRIPTION:${icsEscape(e.details)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
