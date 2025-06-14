const CACHE_NAME = 'mermaid-editor-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/',
  '/vite.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Network-first strategy for HTML documents to ensure fresh CSP headers
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache HTML documents with CSP headers
          return response
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request)
        })
    )
    return
  }
  
  // Cache-first strategy for static assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Only cache static assets, not external CDN resources
          if (url.origin === location.origin &&
              (event.request.url.includes('/assets/') || 
               event.request.url.endsWith('.js') || 
               event.request.url.endsWith('.css') ||
               event.request.url.endsWith('.svg'))) {
            
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
          }

          return response
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
    })
  )
})