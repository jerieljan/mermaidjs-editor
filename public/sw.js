const CACHE_NAME = 'mermaid-editor-v2'
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
          // Don't cache HTML documents with CSP headers
          return response
        })
        .catch((error) => {
          console.error('❌ SW Document Fetch Failed:', event.request.url, error)
          // Fallback to cache only if network fails
          return caches.match(event.request)
        })
    )
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
          throw error
        })
    )
    return
  }
  
  // Handle external CDN resources (like Monaco from jsdelivr.net) - network-first
  if (url.origin !== location.origin) {
    console.log('🌐 SW External Resource:', event.request.url)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          console.log('📥 SW External Response:', event.request.url, response.status, response.type)
          return response
        })
        .catch((error) => {
          console.error('❌ SW External Fetch Failed:', event.request.url, error)
          // Try cache as fallback for external resources
          return caches.match(event.request)
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
        
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
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
          }

          return response
        }).catch((error) => {
          console.error('❌ SW Local Fetch Error:', event.request.url, error)
          throw error
        })
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
