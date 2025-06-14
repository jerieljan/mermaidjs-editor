const CACHE_NAME = 'mermaid-editor-v4'
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/',
  '/vite.svg'
]

// Enhanced logging function
function swLog(message, data = null, level = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [SW ${timestamp}] ${message}`, data || '')
}

self.addEventListener('install', (event) => {
  swLog('Service Worker Installing', CACHE_NAME)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        swLog('Service Worker Cache Opened', CACHE_NAME)
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        swLog('Service Worker Installed Successfully', null, 'success')
        // Force activation of new service worker
        return self.skipWaiting()
      })
      .catch((error) => {
        swLog('Service Worker Install Failed', error, 'error')
        throw error
      })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isMonacoResource = event.request.url.includes('monaco') || 
                          event.request.url.includes('worker') ||
                          event.request.url.includes('editor.worker') ||
                          event.request.url.includes('language') ||
                          event.request.url.includes('vs/') ||
                          event.request.url.includes('jsdelivr.net')
  
  // Enhanced logging for all requests
  swLog(`Fetch Request: ${event.request.method} ${event.request.url}`, {
    destination: event.request.destination,
    mode: event.request.mode,
    type: event.request.type,
    isExternal: url.origin !== location.origin,
    isMonaco: isMonacoResource
  })
  
  // CRITICAL: Handle external CDN resources (like Monaco from jsdelivr.net) - COMPLETE BYPASS
  if (url.origin !== location.origin) {
    swLog('External Resource - BYPASSING Service Worker Completely', event.request.url, 'warn')
    // IMPORTANT: Do not call event.respondWith() for external resources
    // This allows the browser to handle them directly without SW interference
    return
  }
  
  // Network-first strategy for HTML documents to ensure fresh CSP headers
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    
    swLog('Document Request - Network First Strategy', event.request.url)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          swLog('Document Response Success', `${event.request.url} - ${response.status}`, 'success')
          return response
        })
        .catch((error) => {
          swLog('Document Fetch Failed - Trying Cache', `${event.request.url} - ${error.message}`, 'error')
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              swLog('Document Cache Hit', event.request.url, 'success')
              return cachedResponse
            } else {
              swLog('Document Cache Miss - Returning Error Response', event.request.url, 'error')
              return new Response('Network Error', { status: 503 })
            }
          })
        })
    )
    return
  }
  
  // Special handling for Monaco workers - always fetch from network (local only)
  if (isMonacoResource && (event.request.url.includes('worker') || event.request.destination === 'worker')) {
    swLog('Monaco Worker Request - Network Only', event.request.url)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          swLog('Monaco Worker Response Success', `${event.request.url} - ${response.status}`, 'success')
          return response
        })
        .catch((error) => {
          swLog('Monaco Worker Fetch Failed', `${event.request.url} - ${error.message}`, 'error')
          return new Response('Worker Load Failed', { 
            status: 503,
            statusText: 'Service Worker: Monaco Worker Load Failed'
          })
        })
    )
    return
  }
  
  // Cache-first strategy for local static assets only
  swLog('Local Asset Request - Cache First Strategy', event.request.url)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          swLog('Cache Hit', event.request.url, 'success')
          return response
        }
        
        swLog('Cache Miss - Fetching from Network', event.request.url)
        return fetch(event.request.clone())
          .then((response) => {
            swLog('Network Fetch Response', `${event.request.url} - ${response.status}`)
            
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              swLog('Invalid Response - Not Caching', `${event.request.url} - ${response?.status}`, 'warn')
              return response
            }

            // Only cache local static assets
            if (event.request.url.includes('/assets/') || 
                event.request.url.endsWith('.js') || 
                event.request.url.endsWith('.css') ||
                event.request.url.endsWith('.svg')) {
              
              swLog('Caching Asset', event.request.url)
              const responseToCache = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  return cache.put(event.request, responseToCache)
                })
                .then(() => {
                  swLog('Asset Cached Successfully', event.request.url, 'success')
                })
                .catch((cacheError) => {
                  swLog('Cache Put Failed', `${event.request.url} - ${cacheError.message}`, 'error')
                })
            }

            return response
          })
          .catch((error) => {
            swLog('Network Fetch Error', `${event.request.url} - ${error.message}`, 'error')
            return new Response('Network Error', { 
              status: 503,
              statusText: 'Service Worker: Network Error'
            })
          })
      })
      .catch((error) => {
        swLog('Cache Match Error', `${event.request.url} - ${error.message}`, 'error')
        return fetch(event.request.clone())
          .then((response) => {
            swLog('Fallback Fetch Success', `${event.request.url} - ${response.status}`, 'success')
            return response
          })
          .catch((fetchError) => {
            swLog('Fallback Fetch Failed', `${event.request.url} - ${fetchError.message}`, 'error')
            return new Response('Service Worker Error', { 
              status: 503,
              statusText: 'Service Worker: Complete Failure'
            })
          })
      })
  )
})

self.addEventListener('activate', (event) => {
  swLog('Service Worker Activating', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      swLog('Found Existing Caches', cacheNames)
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            swLog('Deleting Old Cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      swLog('Service Worker Activated Successfully', null, 'success')
      // Take control of all clients immediately
      return self.clients.claim()
    }).then(() => {
      swLog('Service Worker Claimed All Clients', null, 'success')
    }).catch((error) => {
      swLog('Service Worker Activation Failed', error, 'error')
    })
  )
})

// Add message handling for debugging
self.addEventListener('message', (event) => {
  swLog('Received Message', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    swLog('Skipping Waiting Phase', null, 'warn')
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Monitor unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  swLog('Unhandled Promise Rejection', event.reason, 'error')
  // Don't prevent the default behavior, but log it
})

// Monitor errors
self.addEventListener('error', (event) => {
  swLog('Service Worker Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'error')
})

swLog('Service Worker Script Loaded', CACHE_NAME)
