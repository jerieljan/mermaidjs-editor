import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidPreviewProps {
  code: string
  isEditorVisible: boolean
  onToggleEditor: () => void
}

const MermaidPreview: React.FC<MermaidPreviewProps> = ({ code, isEditorVisible, onToggleEditor }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastValidSvg, setLastValidSvg] = useState<string>('')
  const [zoom, setZoom] = useState<number>(1)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        fontFamily: 'Inter Display, Helvetica, Arial, sans-serif',
      },
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || !code.trim()) {
      return
    }

    const renderDiagram = async () => {
      // Clean up any existing Mermaid error elements
      const existingErrors = document.querySelectorAll('[id^="d"], .mermaidTooltip, #mermaid-error')
      existingErrors.forEach(el => {
        if (el.textContent?.includes('Syntax error') || el.classList.contains('mermaidTooltip')) {
          el.remove()
        }
      })

      try {
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, code)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          setLastValidSvg(svg)
          setError(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
        // Keep showing the last valid diagram instead of clearing
        if (containerRef.current && lastValidSvg) {
          containerRef.current.innerHTML = lastValidSvg
        }
        
        // Clean up any error elements that might have been created during the failed render
        setTimeout(() => {
          const errorElements = document.querySelectorAll('[id^="d"], .mermaidTooltip, #mermaid-error')
          errorElements.forEach(el => {
            if (el.textContent?.includes('Syntax error') || el.classList.contains('mermaidTooltip')) {
              el.remove()
            }
          })
        }, 0)
      }
    }

    renderDiagram()
  }, [code])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleZoomReset = () => setZoom(1)

  const handleDownloadSvg = () => {
    if (!lastValidSvg || error) return
    
    const blob = new Blob([lastValidSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '0',
        padding: '1rem',
        backgroundColor: '#2c3e50',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 500
      }}>
        <span>Preview</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={onToggleEditor}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              marginRight: '0.5rem'
            }}
          >
            {isEditorVisible ? 'Hide Editor' : 'Show Editor'}
          </button>
          <button 
            onClick={handleZoomOut}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            -
          </button>
          <span style={{ fontSize: '0.9rem', minWidth: '3rem', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            +
          </button>
          <button 
            onClick={handleZoomReset}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Reset
          </button>
          <button 
            onClick={handleDownloadSvg}
            disabled={!lastValidSvg || !!error}
            style={{
              background: (!lastValidSvg || error) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: (!lastValidSvg || error) ? 'rgba(255,255,255,0.4)' : 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: (!lastValidSvg || error) ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              marginLeft: '0.5rem'
            }}
          >
            SVG
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
        {error && (
          <div style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '0.5rem', 
            marginBottom: '1rem',
            borderRadius: '4px',
            border: '1px solid #ffcdd2',
            fontFamily: 'Berkeley Mono, Inconsolata, Menlo, monospace',
            fontSize: '0.85em',
            whiteSpace: 'pre-wrap'
          }}>
            Error: {error}
          </div>
        )}
        <div 
          style={{ 
            minHeight: '200px',
            overflow: 'auto',
            textAlign: 'center'
          }}
        >
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: `${100 / zoom}%`,
              height: zoom < 1 ? `${100 / zoom}%` : 'auto',
              display: 'inline-block'
            }}
          />
        </div>
      </div>
    </>
  )
}

export default MermaidPreview