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
- `App.tsx` - Main application with split-pane editor/preview layout and editor visibility toggle
- `MermaidPreview.tsx` - Handles Mermaid diagram rendering with error handling, cleanup, and UI controls

**Key Dependencies:**
- `@monaco-editor/react` - Code editor (Monaco Editor)
- `mermaid` - Diagram rendering library

**Architecture Notes:**
- Uses Monaco Editor configured for markdown syntax highlighting with Berkeley Mono font
- MermaidPreview component maintains last valid SVG state during syntax errors
- Implements cleanup logic to remove Mermaid error DOM elements that persist after failed renders
- Error boundary pattern: shows error messages while preserving last valid diagram
- Includes zoom controls (zoom in/out/reset) for diagram preview with persistent zoom state
- Split-pane layout with editor on left and live preview on right
- Editor visibility toggle: Hide/Show Editor button in preview pane header allows full-screen preview mode
- Preview pane automatically expands to full width when editor is hidden