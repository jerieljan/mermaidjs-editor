const CACHE_NAME = 'mermaid-editor-v1'
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
  
  // Cache-first strategy for static assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          if (isMonacoResource) {
            console.log('📦 SW Monaco Cache Hit:', event.request.url)
          }
          return response
        }
        
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            if (isMonacoResource) {
              console.log('⚠️ SW Monaco Invalid Response:', event.request.url, response?.status)
            }
            return response
          }

          // Don't cache Monaco resources to avoid conflicts
          if (isMonacoResource) {
            console.log('🚫 SW Monaco - Not Caching:', event.request.url)
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
        }).catch((error) => {
          if (isMonacoResource) {
            console.error('❌ SW Monaco Fetch Error:', event.request.url, error)
          }
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
