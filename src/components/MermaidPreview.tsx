import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidPreviewProps {
  code: string
}

const MermaidPreview: React.FC<MermaidPreviewProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastValidSvg, setLastValidSvg] = useState<string>('')

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      useMaxWidth: false,
      themeVariables: {
        fontFamily: 'Inter Display, sans-serif',
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

  return (
    <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '0.5rem', 
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #ffcdd2',
          fontFamily: 'Berkeley Mono, monospace',
          fontSize: '0.85em',
          whiteSpace: 'pre-wrap'
        }}>
          Error: {error}
        </div>
      )}
      <div 
        ref={containerRef}
        style={{ 
          minHeight: '200px',
          overflow: 'auto',
          textAlign: 'center'
        }}
      />
    </div>
  )
}

export default MermaidPreview