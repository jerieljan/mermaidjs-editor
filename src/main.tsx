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
        
        // Monitor service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 SW update found')
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('🔄 SW state changed:', newWorker.state)
            })
          }
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
