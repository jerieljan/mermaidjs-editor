const CACHE_NAME = 'mermaid-editor-v3'
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/',
  '/vite.svg'
]

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker Installing:', CACHE_NAME)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker Cache Opened:', CACHE_NAME)
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('✅ Service Worker Installed Successfully')
      })
      .catch((error) => {
        console.error('❌ Service Worker Install Failed:', error)
      })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isMonacoResource = event.request.url.includes('monaco') || 
                          event.request.url.includes('worker') ||
                          event.request.url.includes('editor.worker') ||
                          event.request.url.includes('language')
  
  // Log Monaco-related requests
  if (isMonacoResource) {
    console.log('🎯 SW Monaco Request:', event.request.url, {
      method: event.request.method,
      mode: event.request.mode,
      destination: event.request.destination,
      type: event.request.type
    })
  }
  
  // Network-first strategy for HTML documents to ensure fresh CSP headers
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    
    console.log('📄 SW Document Request:', event.request.url)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          console.log('📥 SW Document Response:', event.request.url, response.status)
          return response
        })
        .catch((error) => {
          console.error('❌ SW Document Fetch Failed:', event.request.url, error)
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || new Response('Network Error', { status: 503 })
          })
        })
    )
    return
  }
  
  // Handle external CDN resources (like Monaco from jsdelivr.net) - bypass service worker
  if (url.origin !== location.origin) {
    console.log('🌐 SW External Resource - Bypassing:', event.request.url)
    // Don't intercept external requests - let them go directly to network
    return
  }
  
  // Special handling for Monaco workers - always fetch from network
  if (isMonacoResource && (event.request.url.includes('worker') || event.request.destination === 'worker')) {
    console.log('🔧 SW Monaco Worker - Network Only:', event.request.url)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          console.log('✅ SW Monaco Worker Response:', event.request.url, response.status)
          return response
        })
        .catch((error) => {
          console.error('❌ SW Monaco Worker Failed:', event.request.url, error)
          return new Response('Worker Load Failed', { status: 503 })
        })
    )
    return
  }
  
  // Cache-first strategy for local static assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('📦 SW Cache Hit:', event.request.url)
          return response
        }
        
        console.log('🌐 SW Cache Miss - Fetching:', event.request.url)
        return fetch(event.request.clone())
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              console.log('⚠️ SW Invalid Response:', event.request.url, response?.status)
              return response
            }

            // Only cache local static assets
            if (event.request.url.includes('/assets/') || 
                event.request.url.endsWith('.js') || 
                event.request.url.endsWith('.css') ||
                event.request.url.endsWith('.svg')) {
              
              console.log('💾 SW Caching:', event.request.url)
              const responseToCache = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                })
                .catch((cacheError) => {
                  console.error('❌ SW Cache Put Failed:', event.request.url, cacheError)
                })
            }

            return response
          })
          .catch((error) => {
            console.error('❌ SW Local Fetch Error:', event.request.url, error)
            return new Response('Network Error', { status: 503 })
          })
      })
      .catch((error) => {
        console.error('❌ SW Cache Match Error:', event.request.url, error)
        return fetch(event.request.clone())
          .catch(() => new Response('Service Worker Error', { status: 503 }))
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker Activating:', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('🗂️ SW Found Caches:', cacheNames)
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW Deleting Old Cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('✅ Service Worker Activated Successfully')
    })
  )
})
