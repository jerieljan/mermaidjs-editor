import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register service worker only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  console.log('🔧 Service Worker Registration Starting...')
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered successfully:', registration)
        console.log('SW scope:', registration.scope)
        console.log('SW state:', registration.active?.state)
        
        // Send a message to get SW version for validation
        if (registration.active) {
          const messageChannel = new MessageChannel()
          messageChannel.port1.onmessage = (event) => {
            console.log('📨 SW Version Response:', event.data.version)
          }
          registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2])
        }
        
        // Monitor service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 SW update found')
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('🔄 SW state changed:', newWorker.state)
              if (newWorker.state === 'activated') {
                console.log('🚀 New SW activated - sending skip waiting message')
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          }
        })
        
        // Force update check
        registration.update().then(() => {
          console.log('🔄 SW update check completed')
        }).catch((error) => {
          console.log('⚠️ SW update check failed:', error.message)
        })
      })
      .catch((registrationError) => {
        console.error('❌ SW registration failed:', registrationError)
      })
  })
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 SW Message:', event.data)
  })
  
  // Monitor service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 SW Controller Changed - Page may need refresh')
    // Optionally reload the page to use the new service worker
    // window.location.reload()
  })
  
  // Monitor service worker errors
  navigator.serviceWorker.addEventListener('error', (error) => {
    console.error('❌ SW Error:', error)
  })
} else {
  console.log('ℹ️ Service Worker not registered:', {
    hasServiceWorker: 'serviceWorker' in navigator,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
