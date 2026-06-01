import dayjs from 'dayjs'

// WMO weather code → 絵文字 + 日本語ラベル
const WMO: Record<number, { emoji: string; label: string }> = {
  0: { emoji: '☀️', label: '快晴' },
  1: { emoji: '🌤', label: '晴れ' },
  2: { emoji: '⛅', label: '晴時々曇' },
  3: { emoji: '☁️', label: '曇り' },
  45: { emoji: '🌫', label: '霧' },
  48: { emoji: '🌫', label: '霧' },
  51: { emoji: '🌦', label: '霧雨' },
  53: { emoji: '🌦', label: '霧雨' },
  55: { emoji: '🌦', label: '霧雨' },
  56: { emoji: '🌧', label: '霧雨' },
  57: { emoji: '🌧', label: '霧雨' },
  61: { emoji: '🌧', label: '雨' },
  63: { emoji: '🌧', label: '雨' },
  65: { emoji: '🌧', label: '強い雨' },
  66: { emoji: '🌧', label: '雨' },
  67: { emoji: '🌧', label: '雨' },
  71: { emoji: '❄️', label: '雪' },
  73: { emoji: '❄️', label: '雪' },
  75: { emoji: '❄️', label: '大雪' },
  77: { emoji: '❄️', label: '霧雪' },
  80: { emoji: '🌦', label: 'にわか雨' },
  81: { emoji: '🌦', label: 'にわか雨' },
  82: { emoji: '⛈', label: '激しい雨' },
  85: { emoji: '🌨', label: 'にわか雪' },
  86: { emoji: '🌨', label: 'にわか雪' },
  95: { emoji: '⛈', label: '雷雨' },
  96: { emoji: '⛈', label: '雷雨' },
  99: { emoji: '⛈', label: '雷雨' },
}

function codeInfo(code: number) {
  return WMO[code] ?? { emoji: '·', label: '—' }
}

export type DayForecast = {
  date: string
  emoji: string
  label: string
  tmax: number | null
  tmin: number | null
  precip: number | null // 降水確率(%)
}

// Open-Meteo の予報可能範囲（今日から最大16日先）
const HORIZON_DAYS = 15

/**
 * Open-Meteo（無料・APIキー不要）で指定座標・指定日の日次予報を取得。
 * 予報範囲外（16日より先 or 過去）の日付は除外。取得失敗時は空配列。
 */
export async function fetchForecast(lat: number, lng: number, dates: string[]): Promise<DayForecast[]> {
  const today = dayjs().startOf('day')
  const horizon = today.add(HORIZON_DAYS, 'day')
  const inRange = dates
    .filter(d => {
      const dd = dayjs(d)
      return !dd.isBefore(today) && !dd.isAfter(horizon)
    })
    .sort()
  if (inRange.length === 0) return []

  const start = inRange[0]
  const end = inRange[inRange.length - 1]
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=Asia%2FTokyo&start_date=${start}&end_date=${end}`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const j = await res.json()
    const d = j?.daily
    if (!d?.time) return []
    const wanted = new Set(inRange)
    const out: DayForecast[] = []
    for (let i = 0; i < d.time.length; i++) {
      const date = d.time[i]
      if (!wanted.has(date)) continue
      const ci = codeInfo(d.weather_code?.[i] ?? -1)
      out.push({
        date,
        emoji: ci.emoji,
        label: ci.label,
        tmax: d.temperature_2m_max?.[i] != null ? Math.round(d.temperature_2m_max[i]) : null,
        tmin: d.temperature_2m_min?.[i] != null ? Math.round(d.temperature_2m_min[i]) : null,
        precip: d.precipitation_probability_max?.[i] ?? null,
      })
    }
    return out
  } catch {
    return []
  }
}
