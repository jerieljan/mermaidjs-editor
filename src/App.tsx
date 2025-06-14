import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import MermaidPreview from './components/MermaidPreview'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`

function App() {
  const [code, setCode] = useState(defaultMermaidCode)
  const [isEditorVisible, setIsEditorVisible] = useState(true)

  useEffect(() => {
    // Log environment and CSP information
    console.log('🔍 Monaco Editor Debug Info:')
    console.log('Environment:', import.meta.env.MODE)
    console.log('Production:', import.meta.env.PROD)
    console.log('User Agent:', navigator.userAgent)
    console.log('Service Worker Support:', 'serviceWorker' in navigator)
    
    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('Active Service Workers:', registrations.length)
        registrations.forEach((reg, index) => {
          console.log(`SW ${index}:`, reg.scope, reg.active?.state)
        })
      })
    }

    // Log CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('🚨 CSP Violation:', {
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        originalPolicy: e.originalPolicy,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber
      })
    })

    // Monitor worker creation attempts
    const originalWorker = window.Worker
    if (originalWorker) {
      window.Worker = class extends originalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          console.log('🔧 Worker Creation Attempt:', scriptURL, options)
          try {
            super(scriptURL, options)
            console.log('✅ Worker Created Successfully:', scriptURL)
            
            this.addEventListener('error', (e) => {
              console.error('❌ Worker Error:', scriptURL, e)
            })
          } catch (error) {
            console.error('❌ Worker Creation Failed:', scriptURL, error)
            throw error
          }
        }
      } as any
    }

    // Monitor fetch requests for Monaco resources
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      const url = args[0]
      if (typeof url === 'string' && (url.includes('monaco') || url.includes('worker'))) {
        console.log('🌐 Monaco Fetch:', url)
      }
      return originalFetch.apply(this, args).then(response => {
        if (typeof url === 'string' && (url.includes('monaco') || url.includes('worker'))) {
          console.log('📥 Monaco Fetch Response:', url, response.status, response.ok)
        }
        return response
      }).catch(error => {
        if (typeof url === 'string' && (url.includes('monaco') || url.includes('worker'))) {
          console.error('❌ Monaco Fetch Error:', url, error)
        }
        throw error
      })
    }
  }, [])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    console.log('🎯 Monaco Editor Mounted Successfully')
    console.log('📊 Monaco version:', monaco.version || 'unknown')
    console.log('🎨 Editor instance created:', !!editor)
    console.log('🔧 Monaco Editor API available:', !!monaco.editor)
    
    // Log detailed Monaco configuration
    if (monaco.editor) {
      console.log('✅ Monaco Editor API is ready')
      
      // Check if workers are properly configured
      try {
        const workerConfig = monaco.editor.getWorkers?.() || 'getWorkers not available'
        console.log('🔧 Monaco Worker Config:', workerConfig)
      } catch (error) {
        console.log('⚠️ Monaco Worker Config check failed:', error instanceof Error ? error.message : String(error))
      }
    }
    
    // Enhanced worker monitoring
    editor.onDidChangeModelContent(() => {
      console.log('📝 Editor content changed - triggering language services')
      
      // This will trigger language services which use workers
      setTimeout(() => {
        try {
          const model = editor.getModel()
          if (model) {
            const markers = monaco.editor.getModelMarkers({ resource: model.uri })
            if (markers.length > 0) {
              console.log('📝 Editor markers found:', markers.length)
              markers.forEach((marker: any, index: number) => {
                console.log(`  Marker ${index + 1}:`, {
                  severity: marker.severity,
                  message: marker.message,
                  startLineNumber: marker.startLineNumber,
                  startColumn: marker.startColumn
                })
              })
            } else {
              console.log('✅ No editor markers - language services working correctly')
            }
          }
        } catch (error) {
          console.error('❌ Error checking editor markers:', error)
        }
      }, 1000)
    })
    
    // Test worker functionality immediately
    setTimeout(() => {
      console.log('🧪 Testing Monaco worker functionality...')
      try {
        // Set some content that should trigger language services
        editor.setValue(defaultMermaidCode)
        console.log('✅ Test content set successfully')
      } catch (error) {
        console.error('❌ Failed to set test content:', error)
      }
    }, 500)
  }

  const handleEditorMount = (editor: any, monaco: any) => {
    console.log('🚀 Monaco Editor Mount Event Triggered')
    handleEditorDidMount(editor, monaco)
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {isEditorVisible && (
          <div className="editor-pane">
            <h2>Mermaid Editor</h2>
            <Editor
              height="90vh"
              defaultLanguage="markdown"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                fontFamily: 'Berkeley Mono, Inconsolata, Menlo, monospace',
              }}
            />
          </div>
        )}
        <div className={`preview-pane ${!isEditorVisible ? 'full-width' : ''}`}>
          <MermaidPreview code={code} isEditorVisible={isEditorVisible} onToggleEditor={() => setIsEditorVisible(!isEditorVisible)} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
