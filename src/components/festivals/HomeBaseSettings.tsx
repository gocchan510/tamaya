'use client'
import { useState } from 'react'
import { useHomeBase } from '@/hooks/useHomeBase'

export function HomeBaseSettings() {
  const { homeBase, setHomeBase, clearHomeBase } = useHomeBase()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function geocode(query: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' 日本')}&format=json&limit=1&countrycodes=jp`,
        { headers: { 'Accept-Language': 'ja', 'User-Agent': 'tamaya-fireworks-guide' } }
      )
      const data = await res.json()
      if (!data.length) { setError('場所が見つかりませんでした'); return }
      const label = (data[0].display_name as string).split('、')[0].split(',')[0]
      setHomeBase({ label, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
      setInput('')
    } catch {
      setError('通信エラー')
    } finally {
      setLoading(false)
    }
  }

  function geolocate() {
    if (!navigator.geolocation) { setError('位置情報が使えません'); return }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setHomeBase({ label: '現在地', lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => { setError('位置情報の取得に失敗'); setLoading(false) }
    )
  }

  return (
    <div className="w-full space-y-2">
      <div className="text-xs text-white/40 font-medium tracking-wider uppercase">拠点（距離順ソート用）</div>

      {homeBase ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 glass rounded-full px-3 py-2 text-sm text-white/80 min-w-0">
            <span>📍</span>
            <span className="truncate">{homeBase.label}</span>
          </div>
          <button
            onClick={clearHomeBase}
            className="text-white/35 hover:text-white/70 text-xs px-2 py-2 rounded-full transition-colors whitespace-nowrap"
          >
            解除
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) geocode(input.trim()) }}
            placeholder="駅名・住所を入力"
            className="flex-1 glass rounded-full px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:ring-1 focus:ring-white/20 min-w-0"
          />
          <button
            onClick={() => input.trim() && geocode(input.trim())}
            disabled={loading || !input.trim()}
            className="glass rounded-full px-3 py-2 text-sm text-white/60 hover:text-white/90 disabled:opacity-30 transition-colors whitespace-nowrap"
          >
            {loading ? '…' : '設定'}
          </button>
          <button
            onClick={geolocate}
            disabled={loading}
            title="現在地を使う"
            className="glass rounded-full px-3 py-2 text-sm disabled:opacity-30 transition-colors"
          >
            🎯
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}
    </div>
  )
}
