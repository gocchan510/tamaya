import Link from 'next/link'
import type { Festival, FestivalYear, LotteryPeriod } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { FavoriteButton } from './FavoriteButton'
import { UnfavButton } from './UnfavButton'
import { OfficialLinkButton } from './OfficialLinkButton'

dayjs.locale('ja')

interface Props {
  festival: Festival
  year: FestivalYear | null
  rank: number
  /** rank の代わりに表示する文字列（お気に入りタブの日付ラベル等） */
  rankLabel?: string
  /** 「N日後」計算用の基準日（YYYY-MM-DD）。未指定なら year.date を使う */
  referenceDate?: string
  /** お気に入りタブで、解除用の ♥ ボタンを出す対象日付一覧 */
  favDates?: string[]
  lotteries?: LotteryPeriod[]
  /** カレンダーで日付クリック時の絞り込み日（YYYY-MM-DD）。設定時のみ ♥ ボタンを表示 */
  contextDate?: string | null
  /** デバッグモード: ソースバッジ等を表示 */
  debug?: boolean
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

const TIER_BADGES: Record<string, { label: string; cls: string }> = {
  xl: { label: '🏆 XL', cls: 'bg-gradient-to-r from-amber-400/25 to-fuchsia-400/20 text-amber-200 border-amber-400/40' },
  l:  { label: '⭐ L',  cls: 'bg-gradient-to-r from-sky-500/25 to-violet-500/20 text-sky-200 border-sky-400/40' },
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
  sorahanabi: { label: '空',   cls: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30' },
  kankou:     { label: '観光', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30' },
  furusato_choice: { label: 'ふる', cls: 'bg-red-500/15 text-red-300 border-red-400/30' },
  ticket_pia: { label: 'ぴあ', cls: 'bg-red-600/15 text-red-300 border-red-600/30' },
  eplus:      { label: 'eプ', cls: 'bg-lime-500/15 text-lime-300 border-lime-400/30' },
  hanabier:   { label: 'Hb',  cls: 'bg-teal-500/15 text-teal-300 border-teal-400/30' },
  wikipedia:  { label: 'Wp',  cls: 'bg-slate-400/15 text-slate-300 border-slate-400/30' },
  l_tike:     { label: 'ロチ', cls: 'bg-blue-500/15 text-blue-300 border-blue-400/30' },
  fany:       { label: 'FN',  cls: 'bg-pink-500/15 text-pink-300 border-pink-400/30' },
  cn_play:    { label: 'CN',  cls: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30' },
  enka_kyokai:{ label: '煙協', cls: 'bg-orange-600/15 text-orange-300 border-orange-600/30' },
  four_travel:{ label: '4t',  cls: 'bg-amber-600/15 text-amber-300 border-amber-600/30' },
  hanabi_cloud:{ label: '☁',  cls: 'bg-violet-400/15 text-violet-300 border-violet-400/30' },
  asoview:    { label: 'aso', cls: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' },
  ikyu:       { label: '休',  cls: 'bg-zinc-300/15 text-zinc-300 border-zinc-300/30' },
  local_news: { label: '紙',  cls: 'bg-stone-500/15 text-stone-300 border-stone-500/30' },
  seven_ticket:    { label: '7t', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  rakuten_ticket:  { label: '楽チ', cls: 'bg-red-700/15 text-red-300 border-red-700/30' },
  rakuten_furusato:{ label: '楽ふ', cls: 'bg-rose-600/15 text-rose-300 border-rose-600/30' },
  satofull:        { label: 'さと', cls: 'bg-sky-400/15 text-sky-300 border-sky-400/30' },
  jtb_tour:        { label: 'JTB', cls: 'bg-red-400/15 text-red-300 border-red-400/30' },
  his_tour:        { label: 'HIS', cls: 'bg-yellow-600/15 text-yellow-300 border-yellow-600/30' },
  hankyu_tour:     { label: '阪急', cls: 'bg-amber-900/15 text-amber-400 border-amber-900/30' },
  livepocket:      { label: 'LP',  cls: 'bg-purple-500/15 text-purple-300 border-purple-400/30' },
  ticketrise:      { label: 'TR',  cls: 'bg-teal-600/15 text-teal-300 border-teal-600/30' },
  jre_mall:        { label: 'JRE', cls: 'bg-green-600/15 text-green-300 border-green-600/30' },
  univ_fest:       { label: '大', cls: 'bg-pink-400/15 text-pink-300 border-pink-400/30' },
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

export function FestivalCard({ festival, year, rank, rankLabel, referenceDate, favDates, lotteries = [], contextDate = null, debug = false }: Props) {
  const days = daysUntil(referenceDate ?? year?.date ?? null)
  const sparkColor = SPARK_COLORS[rank % SPARK_COLORS.length]
  const displayLotteries = getDisplayLotteries(lotteries)

  // contextDate がこの大会の開催日に含まれるかチェック
  const eventDates: string[] = year?.event_dates && year.event_dates.length > 0
    ? year.event_dates
    : year?.date
      ? year.end_date
        ? (() => {
            const arr: string[] = []
            for (let d = new Date(year.date); d <= new Date(year.end_date); d.setDate(d.getDate() + 1)) {
              arr.push(d.toISOString().slice(0, 10))
            }
            return arr
          })()
        : [year.date]
      : []
  const showFav = !!contextDate && eventDates.includes(contextDate)

  return (
    <Link href={`/festivals/${festival.id}`} className="block group">
      <article className="glass-card rounded-2xl p-5 relative overflow-hidden">
        {/* 右下: 公式URLリンク（外側が<a>なので、ネスト回避でbuttonにする） */}
        {festival.official_url && (
          <OfficialLinkButton url={festival.official_url} />
        )}
        {/* 左アクセント: 単色グラデの細バー（上から下へフェード） */}
        <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${sparkColor} opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]`} />
        {/* 右上: オーロラ風のソフトグロー（ホバーで強調） */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-400/[0.06] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-start gap-4">
          {/* お気に入りタブ: 左に日付ラベル列（解除ボタン付き） */}
          {rankLabel && (
            <div className="shrink-0 w-14 text-center mt-0.5 flex flex-col items-center gap-1.5">
              <div>
                <div className="text-base font-bold text-red-300 leading-none">{rankLabel}</div>
                <div className="text-[9px] text-red-300/60 mt-0.5">お気に入り</div>
              </div>
              {festival.tier && TIER_BADGES[festival.tier] && (
                <span className={`text-[13px] font-bold px-2 py-1 rounded-lg border ${TIER_BADGES[festival.tier].cls}`}>
                  {TIER_BADGES[festival.tier].label}
                </span>
              )}
              {favDates && favDates.length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  {favDates.map(d => (
                    <UnfavButton key={d} festivalId={festival.id} date={d} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* メイン情報 */}
          <div className="flex-1 min-w-0">
            {/* 上段: ティア + 地名（左） / ランク#N（右） */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                {!rankLabel && festival.tier && TIER_BADGES[festival.tier] && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TIER_BADGES[festival.tier].cls}`}>
                    {TIER_BADGES[festival.tier].label}
                  </span>
                )}
                <span className="text-xs text-white/45 truncate">
                  {festival.prefecture} {festival.city}
                </span>
                {debug && (festival.sources ?? []).map(src => SOURCE_BADGES[src] && (
                  <span key={src} className={`text-[9px] px-1.5 py-px rounded border ${SOURCE_BADGES[src].cls}`} title={src}>
                    {SOURCE_BADGES[src].label}
                  </span>
                ))}
              </div>
              {!rankLabel && (
                <span className="shrink-0 text-[11px] font-mono text-white/20 tabular-nums">#{rank}</span>
              )}
            </div>

            {/* 主役: 大会名 + カウントダウン */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-white leading-snug tracking-tight group-hover:text-amber-200 transition-colors">
                {festival.name}
              </h2>
              <div className="flex items-start gap-2 shrink-0">
                {year?.status === 'cancelled' ? (
                  <span className="text-xs text-red-400/70 font-medium mt-1">中止</span>
                ) : days !== null && days >= 0 && (
                  days === 0 ? (
                    <span className="text-sm font-bold text-emerald-400 glow-ember mt-1">本日開催</span>
                  ) : (
                    <div className="text-right leading-none">
                      <span className="text-2xl font-extrabold text-aurora tabular-nums">{days}</span>
                      <span className="block text-[10px] text-white/40 mt-1">日後</span>
                    </div>
                  )
                )}
                {showFav && contextDate && (
                  <FavoriteButton festivalId={festival.id} date={contextDate} size="sm" showLabel />
                )}
              </div>
            </div>

            {/* 日程 + 確定バッジ */}
            <div className="flex items-center gap-2 mt-2">
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
              {year?.start_time && (
                <span className="text-xs text-white/40">
                  🕐 {year.start_time.slice(0, 5)}{year.end_time ? `〜${year.end_time.slice(0, 5)}` : ''}
                </span>
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
              {year?.max_shell_size && (
                <Tag icon="◉" label={`最大${year.max_shell_size}`} />
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
              <>
              <div className="hairline mt-3.5 mb-0.5" />
              <div className="mt-2 flex flex-col gap-1.5">
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
              </>
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
