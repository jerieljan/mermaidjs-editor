# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build locally

## Architecture

This is a React + TypeScript + Vite application that provides a Mermaid diagram editor with live preview.

**Core Components:**
- `App.tsx` - Main application with split-pane editor/preview layout and editor visibility toggle, wrapped with ErrorBoundary
- `MermaidPreview.tsx` - Handles Mermaid diagram rendering with error handling and UI controls
- `ErrorBoundary.tsx` - React error boundary component for graceful error handling

**Key Dependencies:**
- `@monaco-editor/react` - Code editor (Monaco Editor)
- `mermaid` - Diagram rendering library

**Architecture Notes:**
- Uses Monaco Editor configured for markdown syntax highlighting with Berkeley Mono, Inconsolata, Menlo, monospace font stack
- Font stack: 'Inter Display', Helvetica, Arial, sans-serif for UI elements
- MermaidPreview component maintains last valid SVG state during syntax errors
- Mermaid configured with 'strict' security level for public deployment safety
- Error boundary pattern: shows error messages while preserving last valid diagram
- Includes zoom controls (zoom in/out/reset) for diagram preview with persistent zoom state
- Split-pane layout with editor on left and live preview on right
- Editor visibility toggle: Hide/Show Editor button in preview pane header allows full-screen preview mode
- Preview pane automatically expands to full width when editor is hidden

## Deployment & Security

**Vercel Configuration:**
- `vercel.json` - Configured for Vite SPA deployment with security headers
- Content Security Policy allows Monaco Editor CDN (cdn.jsdelivr.net) while restricting other sources
- Additional security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy

**Performance Optimizations:**
- Code splitting: Vendor libraries (React/DOM), Monaco Editor, and Mermaid separated into chunks
- Service worker for static asset caching (production only)
- Manual chunk configuration in `vite.config.ts` for optimal bundle splitting

**Security Features:**
- Mermaid security level set to 'strict' for public deployment
- CSP headers prevent XSS and other security vulnerabilities
- Error boundary prevents application crashes from propagating