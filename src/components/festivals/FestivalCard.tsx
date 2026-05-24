import Link from 'next/link'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { FavoriteButton } from './FavoriteButton'

dayjs.locale('ja')

interface Props {
  festival: Festival
  year: FestivalYear | null
  rank: number
  lotteries?: LotteryPeriod[]
}

type DisplayLottery = { lottery: LotteryPeriod; state: 'open' | 'upcoming' | 'ended' }

function getDisplayLotteries(lotteries: LotteryPeriod[]): DisplayLottery[] {
  const now = dayjs()
  const sorted = [...lotteries]
    .filter(l => l.lottery_start_at)
    .sort((a, b) => dayjs(a.lottery_start_at!).diff(dayjs(b.lottery_start_at!)))

  // 受付中：開始済み＆（終了前 or 終了日なし）→ 全部表示
  const open = sorted.filter(l => {
    const started = dayjs(l.lottery_start_at!).isBefore(now)
    const notEnded = !l.lottery_end_at || dayjs(l.lottery_end_at).isAfter(now)
    return started && notEnded
  })
  if (open.length) return open.map(l => ({ lottery: l, state: 'open' as const }))

  // 申込予定：これから始まる最も近いもの 1件
  const upcoming = sorted.find(l => dayjs(l.lottery_start_at!).isAfter(now))
  if (upcoming) return [{ lottery: upcoming, state: 'upcoming' }]

  // 終了：直近終了したもの 1件（グレーアウト）
  const ended = [...sorted]
    .filter(l => l.lottery_end_at && dayjs(l.lottery_end_at).isBefore(now))
    .sort((a, b) => dayjs(b.lottery_end_at!).diff(dayjs(a.lottery_end_at!)))[0]
  if (ended) return [{ lottery: ended, state: 'ended' }]

  return []
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-amber-300 glow-gold',
  2: 'text-slate-300',
  3: 'text-amber-600',
}

const TIER_BADGES: Record<string, { label: string; cls: string }> = {
  xl: { label: '🏆 XL', cls: 'bg-amber-400/20 text-amber-300 border-amber-400/40' },
  l:  { label: '⭐ L',  cls: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  m:  { label: '◇ M',  cls: 'bg-white/10 text-white/60 border-white/15' },
  s:  { label: '・ S',  cls: 'bg-white/5 text-white/40 border-white/10' },
  unverified: { label: '?', cls: 'bg-white/5 text-white/30 border-white/10' },
}

const SOURCE_BADGES: Record<string, { label: string; cls: string }> = {
  walkerplus: { label: 'W+',   cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
  jalan:      { label: 'じゃ', cls: 'bg-orange-400/15 text-orange-300 border-orange-400/30' },
  rurubu:     { label: 'るる', cls: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30' },
  jorudan:    { label: 'ジョ', cls: 'bg-green-500/15 text-green-300 border-green-400/30' },
  ekitan:     { label: '駅探', cls: 'bg-rose-500/15 text-rose-300 border-rose-400/30' },
}

const SPARK_COLORS = [
  'bg-amber-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-violet-400',
  'bg-cyan-400',
]

function daysUntil(date: string | null): number | null {
  if (!date) return null
  return dayjs(date).diff(dayjs().startOf('day'), 'day')
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`
  return n.toLocaleString()
}

export function FestivalCard({ festival, year, rank, lotteries = [] }: Props) {
  const days = daysUntil(year?.date ?? null)
  const sparkColor = SPARK_COLORS[rank % SPARK_COLORS.length]
  const displayLotteries = getDisplayLotteries(lotteries)

  return (
    <Link href={`/festivals/${festival.id}`} className="block group">
      <article className="glass glass-hover rounded-2xl p-5 relative overflow-hidden">
        {/* 左アクセントライン */}
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 ${sparkColor} opacity-60 rounded-full`} />

        <div className="flex items-start gap-4">
          {/* ランク */}
          <div className={`rank-badge text-2xl font-bold w-8 shrink-0 text-center leading-none mt-1 ${RANK_COLORS[rank] ?? 'text-white/40'}`}>
            {rank}
          </div>

          {/* メイン情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <p className="text-xs text-white/40">
                    {festival.prefecture} {festival.city}
                  </p>
                  {festival.tier && TIER_BADGES[festival.tier] && (
                    <span className={`text-[9px] px-1.5 py-px rounded border ${TIER_BADGES[festival.tier].cls}`}>
                      {TIER_BADGES[festival.tier].label}
                    </span>
                  )}
                  {(festival.sources ?? []).map(src => SOURCE_BADGES[src] && (
                    <span key={src} className={`text-[9px] px-1.5 py-px rounded border ${SOURCE_BADGES[src].cls}`} title={src}>
                      {SOURCE_BADGES[src].label}
                    </span>
                  ))}
                </div>
                <h2 className="text-base font-semibold text-white/90 leading-tight group-hover:text-amber-300 transition-colors">
                  {festival.name}
                </h2>
              </div>

              {/* 開催日まで + お気に入り */}
              <div className="flex items-start gap-2 shrink-0">
                {year?.status === 'cancelled' ? (
                  <span className="text-xs text-red-400/60">中止</span>
                ) : days !== null && days >= 0 && (
                  <div className="text-right">
                    {days === 0 ? (
                      <span className="text-xs font-bold text-emerald-400 glow-ember">本日開催</span>
                    ) : (
                      <div>
                        <span className="text-lg font-bold text-amber-300">{days}</span>
                        <span className="text-xs text-white/40 ml-0.5">日後</span>
                      </div>
                    )}
                  </div>
                )}
                <FavoriteButton festivalId={festival.id} size="sm" />
              </div>
            </div>

            {/* 日程 + 確定バッジ */}
            <div className="flex items-center gap-2 mt-1.5">
              {year?.status === 'cancelled' ? (
                <span className="text-xs text-red-400/70">開催中止</span>
              ) : year?.event_dates && year.event_dates.length > 0 ? (
                <>
                  <p className="text-sm text-white/50">
                    {year.event_dates.length <= 3
                      ? year.event_dates.map(d => dayjs(d).format('M/D')).join(', ')
                      : `${dayjs(year.event_dates[0]).format('M/D')} 他${year.event_dates.length - 1}日`}
                  </p>
                </>
              ) : year?.date ? (
                <>
                  <p className="text-sm text-white/50">
                    {dayjs(year.date).format('M月D日（dd）')}
                    {year.end_date && (
                      <span className="text-white/40">
                        {' 〜 '}{dayjs(year.end_date).format(dayjs(year.end_date).month() === dayjs(year.date).month() ? 'D日（dd）' : 'M月D日（dd）')}
                      </span>
                    )}
                  </p>
                  {year.date_confirmed
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">確定</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">推定</span>
                  }
                </>
              ) : (
                <span className="text-xs text-white/25">日程未定</span>
              )}
            </div>

            {/* タグ行 */}
            <div className="flex flex-wrap gap-2 mt-2">
              {year?.fireworks_count && (
                <Tag icon="✦" label={`${formatCount(year.fireworks_count)}発`} />
              )}
              {year?.expected_attendance && (
                <Tag icon="◎" label={`例年${formatCount(year.expected_attendance)}人`} />
              )}
              {year?.paid_seats_status === 'available' && (
                <Tag icon="🎟" label="有料席あり" tone="emerald" />
              )}
              {year?.paid_seats_status === 'none' && (
                <Tag icon="○" label="無料観覧のみ" tone="muted" />
              )}
            </div>

            {/* 抽選/有料席情報（受付中は全部、それ以外は1件） */}
            {displayLotteries.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {displayLotteries.map(({ lottery, state }) => (
                  <div
                    key={lottery.id}
                    className={`rounded-lg px-3 py-2 flex items-center justify-between gap-2 ${
                      state === 'open'
                        ? 'bg-emerald-500/10 border border-emerald-500/25'
                        : state === 'upcoming'
                          ? 'bg-amber-400/5 border border-amber-400/15'
                          : 'bg-white/[0.02] border border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {state === 'open' && (
                        <span className="text-[10px] font-bold text-emerald-400 shrink-0">受付中</span>
                      )}
                      {state === 'upcoming' && (
                        <span className="text-[10px] font-bold text-amber-400/70 shrink-0">申込予定</span>
                      )}
                      {state === 'ended' && (
                        <span className="text-[10px] font-bold text-white/40 shrink-0">終了</span>
                      )}
                      <span className={`text-xs truncate ${state === 'ended' ? 'text-white/30 line-through' : 'text-white/50'}`}>
                        {lottery.seat_name.replace(/（.*?）/g, '').replace('（確定）', '').trim()}
                      </span>
                    </div>
                    <span className={`text-xs shrink-0 ${state === 'ended' ? 'text-white/25' : 'text-white/40'}`}>
                      {state === 'open'
                        ? lottery.lottery_end_at
                          ? `〜${dayjs(lottery.lottery_end_at).format('M/D')}`
                          : '受付中'
                        : state === 'upcoming'
                          ? dayjs(lottery.lottery_start_at!).format('M/D〜')
                          : lottery.lottery_end_at
                            ? `${dayjs(lottery.lottery_end_at).format('M/D')}終了`
                            : '終了'
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

function Tag({ icon, label, tone = 'default' }: { icon: string; label: string; tone?: 'default' | 'emerald' | 'muted' }) {
  const toneClasses = {
    default: 'text-white/40 bg-white/5',
    emerald: 'text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20',
    muted: 'text-white/25 bg-white/[0.03]',
  }
  const iconColor = {
    default: 'text-amber-400/70',
    emerald: 'text-emerald-400/80',
    muted: 'text-white/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${toneClasses[tone]}`}>
      <span className={`${iconColor[tone]} text-[10px]`}>{icon}</span>
      {label}
    </span>
  )
}
