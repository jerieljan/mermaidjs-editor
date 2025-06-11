import { useState } from 'react'
import Editor from '@monaco-editor/react'
import MermaidPreview from './components/MermaidPreview'
import './App.css'

const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`

function App() {
  const [code, setCode] = useState(defaultMermaidCode)

  return (
    <div className="app">
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
          }}
        />
      </div>
      <div className="preview-pane">
        <h2>Preview</h2>
        <MermaidPreview code={code} />
      </div>
    </div>
  )
}

export default App
