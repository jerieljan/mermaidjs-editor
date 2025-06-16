import { useState } from 'react'
import Editor from '@monaco-editor/react'
import MermaidPreview from './components/MermaidPreview'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

const defaultMermaidCode = `---
title: Example Diagram
config:
    look: handDrawn
    theme: neutral
---
graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`

function App() {
  const [code, setCode] = useState(defaultMermaidCode)
  const [isEditorVisible, setIsEditorVisible] = useState(true)

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
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                fontFamily: 'Berkeley Mono, Inconsolata, Menlo, monospace',
                fontLigatures: true,
                folding: true
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
