// 直近の更新履歴（最新が先頭）。デプロイ反映確認も兼ねてヘッダーに最新1件を表示する。
export const CHANGELOG: { date: string; text: string }[] = [
  { date: '2026-06-01', text: '拠点設定＋距離順ソートを追加（駅名/住所から近い順に並び替え）' },
  { date: '2026-05-24', text: 'デザイン刷新・Googleカレンダー連携・天気予報を追加' },
]

export const LATEST = CHANGELOG[0]
