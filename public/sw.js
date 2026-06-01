const VERSION = 'tamaya-v2'
const RUNTIME_CACHE = `${VERSION}-runtime`
const PAGE_CACHE = `${VERSION}-pages`

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Don't cache Next.js RSC/data or API routes
  if (url.pathname.startsWith('/api/') || url.searchParams.has('_rsc')) return

  // HTML navigations: network-first（最新HTMLを優先。古いHTMLがデプロイ後に
  // 消えたJSチャンクを参照して落ちるのを防ぐ。オフライン時のみキャッシュにフォールバック）
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE)
        try {
          const res = await fetch(req)
          if (res.ok) cache.put(req, res.clone())
          return res
        } catch {
          const cached = await cache.match(req)
          return cached || Response.error()
        }
      })()
    )
    return
  }

  // Static assets (_next/static, images, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpg|jpeg|svg|webp|woff2?|ico|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE)
        const cached = await cache.match(req)
        if (cached) return cached
        try {
          const res = await fetch(req)
          if (res.ok) cache.put(req, res.clone())
          return res
        } catch {
          return cached || Response.error()
        }
      })()
    )
  }
})
