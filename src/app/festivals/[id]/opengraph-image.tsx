import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import dayjs from 'dayjs'

export const alt = '花火大会の詳細 — たまや'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Google Fonts から指定テキストだけのサブセット TTF を取得（Satori は CJK にフォント必須）
async function loadJPFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const m = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
    if (!m) return null
    const res = await fetch(m[1])
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

const TIER_LABEL: Record<string, string> = { xl: '🏆 XL', l: '⭐ L', m: '◇ M', s: '・ S' }

function fmtCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万発`
  return `${n.toLocaleString()}発`
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: f } = await supabase
    .from('festivals')
    .select('name, prefecture, city, tier, festival_years(date, end_date, event_dates, fireworks_count)')
    .eq('id', id)
    .single()

  const name = f?.name ?? '花火大会'
  const loc = f ? `${f.prefecture} ${f.city}` : ''
  const y = f?.festival_years?.[0]
  const firstDate: string | null = y?.event_dates?.[0] ?? y?.date ?? null
  const dateStr = firstDate ? dayjs(firstDate).format('YYYY年M月D日') : '日程未定'
  const countStr = y?.fireworks_count ? fmtCount(y.fireworks_count) : ''
  const tierStr = f?.tier ? (TIER_LABEL[f.tier] ?? '') : ''

  // サブセット対象の全文字をまとめてフォント取得
  const allText = `たまや TAMAYA 全国の花火大会ガイド ${name} ${loc} ${dateStr} ${countStr} ${tierStr}`
  const font = await loadJPFont(allText)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          background: 'linear-gradient(135deg, #03030f 0%, #0a0a2e 60%, #1a0a2e 100%)',
          color: '#ffffff',
          fontFamily: 'NotoJP',
        }}
      >
        {/* 上部: ブランド */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 34, color: '#fcd34d' }}>🎆</span>
          <span style={{ fontSize: 30, color: '#fcd34d', letterSpacing: 4 }}>たまや</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', letterSpacing: 6 }}>TAMAYA</span>
        </div>

        {/* 中央: 大会名 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.55)' }}>{loc}</span>
          <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, color: '#fde68a' }}>{name}</span>
        </div>

        {/* 下部: 日程・規模 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ fontSize: 34, color: '#fcd34d' }}>{dateStr}</span>
          {countStr && (
            <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🎇 {countStr}
            </span>
          )}
          {tierStr && (
            <span style={{ fontSize: 26, color: '#7dd3fc' }}>{tierStr}</span>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: 'NotoJP', data: font, style: 'normal', weight: 700 }]
        : undefined,
    }
  )
}
