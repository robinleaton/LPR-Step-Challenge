const CACHE_NAME = 'lpr-steps-v1'
const OFFLINE_URL = '/offline'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Silently fail if pages aren't available yet
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful page navigations
        if (event.request.mode === 'navigate' && response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => {
        // Offline fallback — serve cached version or offline page
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          if (event.request.mode === 'navigate') {
            return caches.match('/offline') || new Response(
              '<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0f;color:white"><h2>You\'re offline</h2><p>Check your connection and try again.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          }
        })
      })
  )
})
