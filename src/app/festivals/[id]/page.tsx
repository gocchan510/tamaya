import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FavoriteButton } from '@/components/festivals/FavoriteButton'

// 大会の全開催日（YYYY-MM-DD）を列挙
function collectDates(year: { date: string | null; end_date: string | null; event_dates: string[] | null }): string[] {
  if (year.event_dates && year.event_dates.length > 0) return year.event_dates
  if (!year.date) return []
  if (!year.end_date) return [year.date]
  const arr: string[] = []
  for (let d = new Date(year.date); d <= new Date(year.end_date); d.setDate(d.getDate() + 1)) {
    arr.push(d.toISOString().slice(0, 10))
  }
  return arr
}

export const dynamic = 'force-dynamic'

import { Stars } from '@/components/ui/Stars'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'

dayjs.locale('ja')

function formatDate(dt: string | null, fmt = 'M月D日（dd）HH:mm') {
  if (!dt) return null
  return dayjs(dt).format(fmt)
}

function LotteryRow({ label, start, end, url, confirmed }: {
  label: string
  start: string | null
  end: string | null
  url: string | null
  confirmed: boolean
}) {
  const now = dayjs()
  const isUpcoming = start ? dayjs(start).isAfter(now) : false
  const isEnded = end ? dayjs(end).isBefore(now) : false
  const isOpen = !!start && !isUpcoming && !isEnded

  return (
    <div className={`glass rounded-xl p-4 border transition-colors ${
      isOpen ? 'border-emerald-500/30 bg-emerald-500/5'
      : isEnded ? 'border-transparent opacity-50'
      : 'border-transparent'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-sm font-medium ${isEnded ? 'text-white/40 line-through' : 'text-white/80'}`}>{label}</span>
            {isOpen && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                受付中
              </span>
            )}
            {isEnded && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 font-bold">
                終了
              </span>
            )}
            {!confirmed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">推定</span>
            )}
          </div>

          {start ? (
            <div className="text-xs text-white/50 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400/50">開始</span>
                <span>{formatDate(start, 'M月D日（dd）HH:mm')}</span>
              </div>
              {end && (
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400/50">終了</span>
                  <span>{formatDate(end, 'M月D日（dd）HH:mm')}</span>
                </div>
              )}
              {!end && <span className="text-white/30">終了日未発表</span>}
            </div>
          ) : (
            <p className="text-xs text-white/30">発売日未発表</p>
          )}
        </div>

        {url && isUpcoming && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/20 transition-colors"
          >
            公式サイト →
          </a>
        )}
      </div>
    </div>
  )
}

export default async function FestivalPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: festival } = await supabase
    .from('festivals')
    .select(`*, festival_years(*, lottery_periods(*))`)
    .eq('id', id)
    .single()

  if (!festival) notFound()

  const year = festival.festival_years?.[0]
  const lotteries = year?.lottery_periods ?? []
  const allDates = year ? collectDates(year) : []

  const confirmedLotteries = lotteries.filter((l: { lottery_start_at: string | null }) => l.lottery_start_at !== null)
  const unknownLotteries = lotteries.filter((l: { lottery_start_at: string | null }) => l.lottery_start_at === null)

  return (
    <div className="relative min-h-dvh">
      <Stars />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-16">

        {/* 戻るボタン */}
        <div className="pt-8 pb-6">
          <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
            ← 一覧に戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="mb-3">
            <p className="text-xs text-white/40 mb-1">{festival.prefecture} {festival.city}</p>
            <h1 className="text-2xl font-bold text-white/90 leading-tight">{festival.name}</h1>
            {festival.venue && (
              <p className="text-xs text-white/50 mt-1">📍 {festival.venue}</p>
            )}
          </div>

          {year?.status === 'cancelled' ? (
            <span className="inline-block text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1 rounded-full">
              2026年 開催中止
            </span>
          ) : year?.event_dates && year.event_dates.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-lg text-amber-300 font-semibold">
                {year.event_dates.length}日間開催（{dayjs(year.event_dates[0]).format('YYYY年M月D日')} 〜）
              </span>
              <p className="text-[11px] text-white/40">♥ をタップでその日をお気に入り登録</p>
              <div className="flex flex-wrap gap-1.5">
                {(year.event_dates as string[]).map((d: string) => (
                  <FavoriteButton key={d} festivalId={festival.id} date={d} size="sm" showLabel />
                ))}
              </div>
            </div>
          ) : year?.date && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg text-amber-300 font-semibold">
                  {dayjs(year.date).format('YYYY年M月D日（dd）')}
                  {year.end_date && (
                    <span className="text-amber-300/70">
                      {' 〜 '}{dayjs(year.end_date).format(dayjs(year.end_date).month() === dayjs(year.date).month() ? 'D日（dd）' : 'M月D日（dd）')}
                    </span>
                  )}
                </span>
                {year.date_confirmed
                  ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">確定</span>
                  : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">推定</span>
                }
              </div>
              {allDates.length > 1 ? (
                <>
                  <p className="text-[11px] text-white/40">♥ をタップでその日をお気に入り登録</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allDates.map(d => (
                      <FavoriteButton key={d} festivalId={festival.id} date={d} size="sm" showLabel />
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <FavoriteButton festivalId={festival.id} date={year.date} size="sm" showLabel />
                </div>
              )}
            </div>
          )}
          {year?.start_time && (
            <p className="text-sm text-white/60 mt-2">
              🕐 {year.start_time.slice(0, 5)}{year.end_time ? ` 〜 ${year.end_time.slice(0, 5)}` : ' 開始'}
            </p>
          )}
        </div>

        {/* 規模情報 */}
        {year && (year.fireworks_count || year.expected_attendance || year.max_shell_size) && (
          <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-6">
            {year.fireworks_count && (
              <div>
                <p className="text-xs text-white/30 mb-0.5">打ち上げ数</p>
                <p className="text-xl font-bold text-amber-300">
                  {year.fireworks_count >= 10000
                    ? `${(year.fireworks_count / 10000).toFixed(0)}万発`
                    : `${year.fireworks_count.toLocaleString()}発`}
                </p>
              </div>
            )}
            {year.expected_attendance && (
              <div>
                <p className="text-xs text-white/30 mb-0.5">例年来場者数</p>
                <p className="text-xl font-bold text-white/70">
                  {year.expected_attendance >= 10000
                    ? `${(year.expected_attendance / 10000).toFixed(0)}万人`
                    : `${year.expected_attendance.toLocaleString()}人`}
                </p>
              </div>
            )}
            {year.max_shell_size && (
              <div>
                <p className="text-xs text-white/30 mb-0.5">最大号数</p>
                <p className="text-xl font-bold text-amber-300/90">{year.max_shell_size}</p>
              </div>
            )}
          </div>
        )}

        {/* 説明 */}
        {festival.description && (
          <p className="text-sm text-white/50 mb-8 leading-relaxed">{festival.description}</p>
        )}

        {/* 有料席・抽選情報 */}
        <section>
          <h2 className="text-sm font-semibold text-white/60 tracking-widest uppercase mb-4">
            有料席 / 抽選スケジュール
          </h2>

          {year?.status === 'cancelled' ? (
            <p className="text-sm text-white/30">2026年は開催中止のため、有料席の販売はありません。</p>
          ) : lotteries.length === 0 ? (
            <p className="text-sm text-white/30">情報未発表です。公式サイトをご確認ください。</p>
          ) : (
            <div className="space-y-3">
              {confirmedLotteries.map((l: {
                id: string
                seat_name: string
                lottery_start_at: string | null
                lottery_end_at: string | null
                lottery_url: string | null
              }) => (
                <LotteryRow
                  key={l.id}
                  label={l.seat_name}
                  start={l.lottery_start_at}
                  end={l.lottery_end_at}
                  url={l.lottery_url}
                  confirmed={!l.seat_name.includes('推定')}
                />
              ))}
              {unknownLotteries.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  {unknownLotteries.map((l: {
                    id: string
                    seat_name: string
                    lottery_start_at: string | null
                    lottery_end_at: string | null
                    lottery_url: string | null
                  }) => (
                    <LotteryRow
                      key={l.id}
                      label={l.seat_name}
                      start={null}
                      end={null}
                      url={l.lottery_url}
                      confirmed={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 公式サイトリンク */}
        {festival.official_url && (
          <div className="mt-8">
            <a
              href={festival.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 glass glass-hover rounded-xl py-3 text-sm text-amber-300/80 hover:text-amber-300"
            >
              公式サイトで最新情報を確認 →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
