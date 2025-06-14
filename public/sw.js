const CACHE_NAME = 'mermaid-editor-v4'
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/vite.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Handle external CDN resources (like Monaco from jsdelivr.net) - bypass service worker
  if (url.origin !== location.origin) {
    // Don't intercept external requests - let them go directly to network
    return
  }
  
  // Network-first strategy for HTML documents to ensure fresh CSP headers
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response
        })
        .catch((error) => {
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse
            } else {
              return new Response('Network Error', { status: 503 })
            }
          })
        })
    )
    return
  }
  
  // Cache-first strategy for local static assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        
        return fetch(event.request.clone())
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response
            }

            // Only cache local static assets
            if (event.request.url.includes('/assets/') || 
                event.request.url.endsWith('.js') || 
                event.request.url.endsWith('.css') ||
                event.request.url.endsWith('.svg')) {
              
              const responseToCache = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  return cache.put(event.request, responseToCache)
                })
            }

            return response
          })
          .catch((error) => {
            return new Response('Network Error', { 
              status: 503,
              statusText: 'Service Worker: Network Error'
            })
          })
      })
      .catch((error) => {
        return fetch(event.request.clone())
          .then((response) => {
            return response
          })
          .catch((fetchError) => {
            return new Response('Service Worker Error', { 
              status: 503,
              statusText: 'Service Worker: Complete Failure'
            })
          })
      })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})