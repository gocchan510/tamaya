@AGENTS.md

# Tamaya（たまや）— 花火大会ガイド

全国の花火大会の日程・有料席販売情報・天気をまとめるPWA。

- **本番**: https://tamaya-iota.vercel.app
- **GitHub**: https://github.com/gocchan510/tamaya
- **DB（Supabase）**: `https://cjotemmzfdogmbunbrjh.supabase.co`（リージョン: Tokyo）

## 技術スタック

- Next.js 16.2.4 (App Router, Turbopack, Server Components)
- TypeScript / Tailwind CSS v4
- Supabase (PostgreSQL + RLS)
- Vercel ホスティング、GitHub連携で自動デプロイ
- PWA: manifest + `public/sw.js`（オフライン対応・cache-first）

## DBスキーマ要点

```
festivals (id, name, prefecture, city, lat, lng,
           official_url, walkerplus_url, description,
           ranking_score, tier)
festival_years (id, festival_id, year,
                date, end_date, event_dates,  -- 単日/連続/不連続を区別
                status, fireworks_count, expected_attendance,
                date_confirmed, paid_seats_status)
lottery_periods (id, festival_year_id, seat_name,
                 lottery_start_at, lottery_end_at, lottery_url)
scrape_logs (id, ran_at, target_count, success, inserted,
             updated, skipped, failed, report)
```

### 日程表現の使い分け
- **単日**: `date` のみ
- **連続複数日（毎日花火）**: `date` + `end_date`（範囲）
- **不連続複数日（期間中の特定日に複数回打ち上げ）**: `event_dates: jsonb` 配列を使用
- **完全に未定**: `date=null`、`status='scheduled'`

### ティア判定式（幾何平均）
```js
score = sqrt((fireworks_count/1000) * (expected_attendance/10000))
// 片方しか無ければ ある方/2
xl: score≥20, l: score≥8, m: score≥3, s: score<3, unverified: 規模情報なし
```

## アーキテクチャ要点

- **`dynamic = 'force-dynamic'`**: page.tsx / festivals/[id]/page.tsx は毎リクエストfresh fetch
- **ティアフィルタはクライアント側で適用**: URLパラメータ `?tier=xl,l,m,s,unverified`
- **EventCalendar**: ティアフィルタとお気に入りタブを反映して「表示中の大会の開催日」だけ青く点灯
- **お気に入り**: localStorage（`tamaya:favorites`）、`useSyncExternalStore` で共有
- **Supabase free tier 制約**: 7日間アクセス無いとpauseされる → daily scraperでアクセスして回避

## デプロイ運用

- ローカル開発 (`npm run dev`) で動作確認 → 区切りでまとめてGitHub push → Vercel自動デプロイ
- DB変更は即座にローカル・本番両方に反映（DB共有）

## 環境変数（Vercel + .env.local）

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  -- サーバー側のみ（クライアントに漏らさない）
SUPABASE_PAT               -- DDL用、ローカルのみ（scriptsで使用）
```

## scripts/ ディレクトリ

`.gitignore` で除外（service_role keyをハードコードしているため）。  
ローカルメンテナンス専用ツール。push禁止。

## Supabase 管理API（PAT経由）

DDL（`ALTER TABLE` 等）は Management API で実行:
```bash
curl -X POST 'https://api.supabase.com/v1/projects/{ref}/database/query' \
  -H 'Authorization: Bearer sbp_...' \
  -H 'Content-Type: application/json' \
  -d '{"query": "alter table ..."}'
```

## 重要な制約・運用ルール

- **public repo**: secrets は絶対に commit しない（`scripts/`, `.env*`, `.claude/` は `.gitignore`）
- **日本語含むJSONをcurlで送る時**: Git Bashで引数渡しは壊れるので、`--data @/tmp/payload.json` のファイル経由必須
- **冪等性**: scraperは「既存名一致 or 緯度経度0.5km以内」でdedup
- **scrape は Anthropic scheduled task で routine 化**（現在 disabled）
  - trigger_id: `trig_011ocjgQHRSddejXHALLQnx9`
  - 毎日 18:00 UTC（03:00 JST）にWalker+起点でスクレイプ予定

---

# 更新履歴

## 2026-05-24

### データ拡張
- **Phase 1〜4 で 45 → 191大会** に拡張（関東Walker+ 完全網羅）
  - XL: 30 / L: 32 / M: 49 / S: 72 / unverified: 8
- ティアスコア式を **幾何平均（√積）** ベースに統一
- `tier` カラムを `festivals` に追加（`xl/l/m/s/unverified`）
- `event_dates jsonb` カラムを `festival_years` に追加
- `paid_seats_status text` カラムを `festival_years` に追加（`available/none/unknown`）
- `end_date date` カラムを `festival_years` に追加
- `scrape_logs` テーブル追加（自動スクレイプログ用）
- `walkerplus_url` カラムを `festivals` に追加
- ところざわ花火大会を削除（実在しない疑い、所沢の花火は西武園ゆうえんち大火祭りのみ）

### UI機能
- お気に入り（localStorage） + タブ切り替え
- ティアフィルタ（XL/L/M/S/規模不明、デフォルトXL+L）
- 月別フィルタ + 日付範囲ピッカー
- ミニカレンダー（開催日/お気に入り/今日/選択中を色分け）
- 受付中のみフィルタ
- 受付中の有料席は全件表示（複数あれば全部スタック）
- 終了した抽選もグレーアウト表示
- 有料席ありタグ
- ソート: 人気順 / 日程順
- 複数日開催対応（連続: end_date / 不連続: event_dates）

### 公式URL監査
- 全47件HTTP生存確認
- 14件の死んだ/間違ったURLを正しい公式URLに置換
- Walker+を公式URLとして登録していた3件（足立・八王子・足利）を修正

### スクレイパー
- Walker+起点 + 外部チケットサイト（ぴあ・イープラス・ローチケ・FANY・ふるさと納税等）追跡
- daily scheduled task として trigger 設定（現在disabled、cron時刻 18:00 UTC）

### デプロイ
- Vercel本番化（https://tamaya-iota.vercel.app）
- PWA対応（manifest, アイコン, service worker）

### 設計修正
- 複数日開催の正確な日程取得（阿字ヶ浦6日・天津小湊毎晩・小川町・ひたちなかは土曜のみ等）
- カレンダーがティア/タブフィルタを反映するように修正
- TierFilter のバグ修正（全選択時に param 削除されて XL+L に戻る問題）

### カレンダー曜日/祝日カラーリング
- 土日・祝日の数字を赤系で表示
- `src/lib/holidays.ts` に日本の祝日リスト（2026/2027）を集約
- 2028以降は同ファイルに追記する運用

### 日程ステータスフィルタ追加
- 「✓ 確定 / ▲ 推定 / ? 未定」の3状態フィルタピル
- URLパラメータ `?dstatus=confirmed,estimated,undetermined`
- デフォルト全ON
- FestivalList + EventCalendar 両方に適用

### 検索ボックス追加
- 大会名 / 都道府県 / 市区町村 を部分一致で検索
- URLパラメータ `?q=...`
- 300msデバウンス
- FestivalList + EventCalendar 両方に適用
- **オートコンプリート候補**ドロップダウン（最大8件、ティアバッジ付き、↑↓Enterキー対応）

### 都道府県フィルタ追加
- DBの全都道府県を抽出して紫ピル表示
- 関東7都県を先頭、他は末尾
- URLパラメータ `?pref=東京都,神奈川県` （カンマ区切り）

### ソース管理（マルチソース対応）
- `festivals.sources text[]` カラム追加（'walkerplus', 'jalan', 'rurubu', 'jorudan', 'ekitan'）
- 各scraperは投入時にsources[]に該当値をセット
- **SourceFilter ピル**: Walker+/じゃらん/るるぶ/ジョルダン/駅探 で表示絞り込み（重複は初出ソース扱い）
- **FestivalCard にソースバッジ**: 'W+'/'じゃ'/'るる'/'ジョ'/'駅探' を県市名の隣に小さく表示

### 日程ステータスフィルタ拡張
- 「🏁 終了」オプション追加（デフォルトOFF）
- 大会の最終開催日が過去なら「終了」判定
- event_dates 配列の最終要素 / end_date / date の優先順
- デフォルトで過去大会は非表示

### カレンダー初期表示
- 「最初のイベント月」→ 「今月」に変更（リロード毎に今月から始まる）

### 静岡県データ追加（49件）
- Walker+ + じゃらん + るるぶ + ジョルダン 4ソース横断
- 安倍川花火（XL・1万2500発/57万人）、ふくろい遠州、沼津・伊東按針祭・清水みなと祭り 等
- 熱海海上花火は春夏秋冬 4シーズン分（駅探で秋冬を補完）

### スクレーパー進捗（関東 Walker+ 完全網羅後の補完）
- Walker+ ベース: 186件
- じゃらん補完: +14件
- るるぶ補完: +7件
- ジョルダン補完: +14件
- 駅探補完: +2件
- 静岡県: +49件（全ソース）
- **削除**: PL花火芸術・ところざわ花火大会・せいせき多摩川・御前山納涼・川島地区（恒久廃止/実在せず）
- **現在 262件**

### MonthFilter 簡素化
- 月別ピル（5月〜11月）を削除
- 日付範囲ピッカー（from-to）のみ残す

### ソース拡張（12ソース対応）
- `sources` を Walker+/じゃらん/るるぶ/ジョルダン/駅探/空花火/観光協会/ふるさとチョイス/ぴあ/イープラス/Hanabier(hanabidia)/Wikipedia に拡大
- SourceFilter ピル + FestivalCard バッジ全部対応
- 5月時点で関東+静岡を **321件まで拡張**

### スキーマ追加
- `festivals.venue text` (会場名)
- `festival_years.start_time time` / `end_time time` (打ち上げ時刻)
- `festival_years.max_shell_size text` (最大号数: "二尺玉" "10号" 等)
- それぞれUIに表示（カードにタグ、詳細に区画）

### ソート機能拡張
- SortToggle に「打上数」「来場者」「号数」追加
- 号数は漢数字 "三尺玉" を 30号として解釈してソート

### カレンダー: お気に入り有料席表示
- カレンダーセルに金色の細い帯：お気に入り大会の lottery_periods 期間
- カレンダー下に「♥ お気に入り大会の有料席」リスト
  - 受付中/予定/終了 を色分け
  - クリックで詳細ページ
- 凡例にも 🎫 販売中 を追加

### ソース17種運用（Phase 1〜5完了）
- Walker+/じゃらん/るるぶ/ジョルダン/駅探/空花火/観光協会/ふるさとチョイス/ぴあ/イープラス/Hanabidia/Wikipedia/ローチケ/FANY/CNプレイガイド/煙火協会/4travel
- DB: 333件（Phase 5完了後、3件廃止削除）
- 削除済: 鶴見川サマー・草加市民納涼・サンセットページェント沼津（恒久廃止）

### 市町村観光協会クロール（全7県+静岡 完走）
- 関東1都6県+静岡の **326市町村** をフル巡回
- 追加 **+82件**（栃木11・群馬9・茨城12・千葉11・静岡4・東京13・神奈川11・埼玉11）
- 注目発見:
  - 塩谷町ふるさと納涼祭花火（L、1万発）
  - 埼スタ John Williams Fireworks（L、1万発）
  - よみうりランド冬5週連続花火（神奈川/川崎、6,000発）
  - 茅ヶ崎サザン芸術花火（m、1万発・有料席）
  - 草津温泉冬花火・むさしの村夜桜花火・伊東とっておき冬花火 など **オフシーズン花火**多数
  - 小笠原サマーフェス花火（島嶼）
  - 長南町大花火（千葉、1819年起源・二尺玉）
- **sources=['kankou']** で一律タグ付け
- DB: **415件** 達成
